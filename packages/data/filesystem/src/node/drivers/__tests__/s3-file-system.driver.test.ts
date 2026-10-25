/**
 * Stackra file contract:
 * Purpose: unit tests of `S3FileSystemDriver`: the commands it sends for each call, the bucket, region, endpoint and
 *          path style it builds its client with, not-found mapping, paged listing, and a real SigV4 presigned URL.
 * Boundary: test only; `S3Client.prototype.send` is replaced, so no request leaves the process. Presigning is local
 *           computation, run with fake credentials set through the environment for the test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0222 (decision 1).
 */
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { FilesystemConfig } from "#config/filesystem.config";
import { FileSystem } from "#contracts/ports/file-system.port";
import { FileNotFoundError } from "#core/errors/file-not-found.error";
import { S3FileSystemDriver } from "#node/drivers/s3-file-system.driver";

/** A store error as the SDK throws it for a missing object. */
function missing(name: "NoSuchKey" | "NotFound"): Error {
  return Object.assign(new Error(name), { name, $metadata: { httpStatusCode: 404 } });
}

/** Replaces `send` with `answer` and returns the spy. */
function answer(reply: (command: unknown) => unknown) {
  return vi
    .spyOn(S3Client.prototype, "send")
    .mockImplementation((async (command: unknown) => reply(command)) as never);
}

/** An s3 disk over `acme-files`. */
function disk(s3: Partial<FilesystemConfig["s3"]> = {}): S3FileSystemDriver {
  return new S3FileSystemDriver(
    buildConfig(FilesystemConfig, {
      values: {
        disk: "s3",
        url: "https://cdn.acme.test",
        s3: {
          bucket: "acme-files",
          region: "us-east-1",
          endpoint: null,
          forcePathStyle: false,
          ...s3,
        },
      },
    }),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("S3FileSystemDriver", () => {
  it("is a driver of FileSystem", () => {
    expect(disk()).toBeInstanceOf(FileSystem);
    expect(kindOf(S3FileSystemDriver)).toEqual({ kind: "driver", options: { port: FileSystem } });
  });

  it("refuses a config without a bucket", () => {
    expect(() => new S3FileSystemDriver(buildConfig(FilesystemConfig))).toThrow(/s3\.bucket/);
  });

  it("builds its client from the region, endpoint and path style", async () => {
    const files = disk({ region: "auto", endpoint: "https://acct.r2.test", forcePathStyle: true });
    expect(await files.client.config.region()).toBe("auto");
    expect(files.client.config.forcePathStyle).toBe(true);
    const endpoint = await files.client.config.endpoint?.();
    expect(endpoint?.hostname).toBe("acct.r2.test");
  });

  it("puts a file with its key, body and content type", async () => {
    const send = answer(() => ({}));
    await disk().write("/exports//orders.csv", "a,b", { contentType: "text/csv" });
    const command = send.mock.calls[0]?.[0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect((command as PutObjectCommand).input).toEqual({
      Bucket: "acme-files",
      Key: "exports/orders.csv",
      Body: "a,b",
      ContentType: "text/csv",
    });
  });

  it("reads the bytes of an object and maps NoSuchKey to FileNotFoundError", async () => {
    answer((command) => {
      if ((command as GetObjectCommand).input.Key === "missing.txt") throw missing("NoSuchKey");
      return { Body: { transformToByteArray: async () => new Uint8Array([104, 105]) } };
    });
    const files = disk();
    expect(new TextDecoder().decode(await files.read("hi.txt"))).toBe("hi");
    await expect(files.read("missing.txt")).rejects.toThrow(FileNotFoundError);
  });

  it("rethrows any other store error as it is", async () => {
    const denied = Object.assign(new Error("AccessDenied"), {
      name: "AccessDenied",
      $metadata: { httpStatusCode: 403 },
    });
    answer(() => {
      throw denied;
    });
    await expect(disk().read("a.txt")).rejects.toBe(denied);
    await expect(disk().exists("a.txt")).rejects.toBe(denied);
  });

  it("checks existence and stats with HEAD", async () => {
    const modified = new Date("2026-10-24T09:00:00.000Z");
    const send = answer((command) => {
      if ((command as HeadObjectCommand).input.Key === "gone.txt") throw missing("NotFound");
      return { ContentLength: 7, LastModified: modified, ContentType: "text/plain" };
    });
    const files = disk();
    expect(await files.exists("a.txt")).toBe(true);
    expect(await files.exists("gone.txt")).toBe(false);
    expect(await files.stat("a.txt")).toEqual({
      path: "a.txt",
      size: 7,
      lastModified: modified,
      contentType: "text/plain",
    });
    await expect(files.stat("gone.txt")).rejects.toThrow(FileNotFoundError);
    expect(send.mock.calls.every(([command]) => command instanceof HeadObjectCommand)).toBe(true);
  });

  it("deletes only what exists and says which", async () => {
    const send = answer((command) => {
      if (command instanceof HeadObjectCommand && command.input.Key === "gone.txt")
        throw missing("NotFound");
      return {};
    });
    const files = disk();
    expect(await files.delete("a.txt")).toBe(true);
    expect(await files.delete("gone.txt")).toBe(false);
    const deletes = send.mock.calls
      .map(([command]) => command)
      .filter((command) => command instanceof DeleteObjectCommand)
      .map((command) => command.input);
    expect(deletes).toEqual([{ Bucket: "acme-files", Key: "a.txt" }]);
  });

  it("follows every page of a listing and sorts the keys", async () => {
    const send = answer((command) => {
      const { ContinuationToken } = (command as ListObjectsV2Command).input;
      return ContinuationToken === undefined
        ? { Contents: [{ Key: "img/b.png" }], IsTruncated: true, NextContinuationToken: "page-2" }
        : { Contents: [{ Key: "img/a.png" }, {}], IsTruncated: false };
    });
    expect(await disk().list("/img/")).toEqual(["img/a.png", "img/b.png"]);
    expect(send.mock.calls.map(([command]) => (command as ListObjectsV2Command).input)).toEqual([
      { Bucket: "acme-files", Prefix: "img/" },
      { Bucket: "acme-files", Prefix: "img/", ContinuationToken: "page-2" },
    ]);
  });

  it("serves public URLs from filesystem.url", () => {
    expect(disk().url("a b.png")).toBe("https://cdn.acme.test/a%20b.png");
  });

  it("presigns a GET for the duration, in whole seconds", async () => {
    vi.stubEnv("AWS_ACCESS_KEY_ID", "TEST_ONLY_ACCESS_KEY_ID");
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "test-only-not-a-secret");
    const link = new URL(await disk().temporaryUrl("exports/orders.csv", Duration.minutes(10)));
    expect(link.hostname).toBe("acme-files.s3.us-east-1.amazonaws.com");
    expect(link.pathname).toBe("/exports/orders.csv");
    expect(link.searchParams.get("X-Amz-Expires")).toBe("600");
    expect(link.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("refuses a key outside the bucket", async () => {
    answer(() => ({}));
    await expect(disk().write("../x", "y")).rejects.toThrow(RangeError);
  });
});

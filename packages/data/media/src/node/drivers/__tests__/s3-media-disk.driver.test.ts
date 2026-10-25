/**
 * Stackra file contract:
 * Purpose: unit tests of `S3MediaDiskDriver`: a real SigV4 presigned `PUT` that signs the content type and keeps the
 *          metadata as signed headers (not query parameters), the commands it sends for stat, move and delete,
 *          not-found mapping, both URL forms, and a refused config.
 * Boundary: test only; `S3Client.prototype.send` is replaced, so no request leaves the process. Presigning is local
 *           computation, run with fake credentials set through the environment for the test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decisions 1 to 3).
 */
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { FileNotFoundError, FilesystemConfig } from "@stackra/filesystem";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MediaDisk } from "#contracts/ports/media-disk.port";
import { S3MediaDiskDriver } from "#node/drivers/s3-media-disk.driver";

/** A store error as the SDK throws it for a missing object. */
function missing(name: "NoSuchKey" | "NotFound"): Error {
  return Object.assign(new Error(name), { name, $metadata: { httpStatusCode: 404 } });
}

/** Replaces `send` with `reply` and returns the spy. */
function answer(reply: (command: unknown) => unknown) {
  return vi
    .spyOn(S3Client.prototype, "send")
    .mockImplementation((async (command: unknown) => reply(command)) as never);
}

/** An s3 media disk over `acme-files`, served from `url`. */
function disk(url: string | null = "https://cdn.acme.test"): S3MediaDiskDriver {
  return new S3MediaDiskDriver(
    buildConfig(FilesystemConfig, {
      values: {
        disk: "s3",
        url,
        s3: { bucket: "acme-files", region: "us-east-1", endpoint: null, forcePathStyle: false },
      },
    }),
  );
}

/** Sets test-only credentials so the presigner can sign locally. */
function fakeCredentials(): void {
  vi.stubEnv("AWS_ACCESS_KEY_ID", "TEST_ONLY_ACCESS_KEY_ID");
  vi.stubEnv("AWS_SECRET_ACCESS_KEY", "test-only-not-a-secret");
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("S3MediaDiskDriver", () => {
  it("is a driver of MediaDisk", () => {
    expect(disk()).toBeInstanceOf(MediaDisk);
    expect(kindOf(S3MediaDiskDriver)).toEqual({ kind: "driver", options: { port: MediaDisk } });
  });

  it("refuses a config without a bucket", () => {
    expect(() => new S3MediaDiskDriver(buildConfig(FilesystemConfig))).toThrow(/s3\.bucket/);
  });

  it("presigns a PUT that signs the content type and the metadata headers", async () => {
    fakeCredentials();
    const target = await disk().signUpload("uploads/upl_1", {
      contentType: "image/png",
      metadata: { bucket: "catalogue.product_images", expires: "2026-10-24T10:00:00.000Z" },
      expiresIn: Duration.minutes(10),
    });
    const link = new URL(target.url);
    expect(link.hostname).toBe("acme-files.s3.us-east-1.amazonaws.com");
    expect(link.pathname).toBe("/uploads/upl_1");
    expect(link.searchParams.get("X-Amz-Expires")).toBe("600");
    const signed = link.searchParams.get("X-Amz-SignedHeaders")?.split(";") ?? [];
    expect(signed).toEqual(
      expect.arrayContaining(["content-type", "host", "x-amz-meta-bucket", "x-amz-meta-expires"]),
    );
    expect(link.searchParams.has("x-amz-meta-bucket")).toBe(false);
    // no checksum of the empty body, which would refuse the browser's real bytes
    expect([...link.searchParams.keys()].some((name) => /checksum/i.test(name))).toBe(false);
    expect(target).toMatchObject({
      method: "PUT",
      headers: {
        "content-type": "image/png",
        "x-amz-meta-bucket": "catalogue.product_images",
        "x-amz-meta-expires": "2026-10-24T10:00:00.000Z",
      },
    });
  });

  it("stats an object, and reports a missing one as null", async () => {
    const send = answer((command) => {
      if ((command as HeadObjectCommand).input.Key === "uploads/gone") throw missing("NotFound");
      return { ContentLength: 4, ContentType: "image/png", Metadata: { bucket: "a.b" } };
    });
    expect(await disk().stat("uploads/upl_1")).toEqual({
      size: 4,
      contentType: "image/png",
      metadata: { bucket: "a.b" },
    });
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(HeadObjectCommand);
    expect(await disk().stat("uploads/gone")).toBeNull();
  });

  it("rethrows a store error that is not a missing object", async () => {
    answer(() => {
      throw Object.assign(new Error("AccessDenied"), { name: "AccessDenied" });
    });
    await expect(disk().stat("uploads/upl_1")).rejects.toThrow("AccessDenied");
  });

  it("moves by a server-side copy and a delete", async () => {
    const send = answer(() => ({}));
    await disk().move("uploads/upl 1", "public/catalogue/product_images/upl_1.png");
    const [copy, remove] = send.mock.calls.map(([command]) => command);
    expect(copy).toBeInstanceOf(CopyObjectCommand);
    expect((copy as CopyObjectCommand).input).toEqual({
      Bucket: "acme-files",
      Key: "public/catalogue/product_images/upl_1.png",
      CopySource: "acme-files/uploads/upl%201",
    });
    expect(remove).toBeInstanceOf(DeleteObjectCommand);
    expect((remove as DeleteObjectCommand).input).toEqual({
      Bucket: "acme-files",
      Key: "uploads/upl 1",
    });
  });

  it("refuses to move nothing and deletes nothing", async () => {
    const send = answer(() => {
      throw missing("NoSuchKey");
    });
    await expect(disk().move("uploads/upl_1", "public/x.png")).rejects.toBeInstanceOf(
      FileNotFoundError,
    );
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("deletes an object and says whether there was one", async () => {
    const present = answer(() => ({ ContentLength: 1 }));
    expect(await disk().delete("uploads/upl_1")).toBe(true);
    expect(present.mock.calls[1]?.[0]).toBeInstanceOf(DeleteObjectCommand);
    vi.restoreAllMocks();
    const absent = answer(() => {
      throw missing("NotFound");
    });
    expect(await disk().delete("uploads/upl_1")).toBe(false);
    expect(absent).toHaveBeenCalledTimes(1);
  });

  it("serves URLs from filesystem.url and refuses without one", () => {
    expect(disk().url("public/a b.png")).toBe("https://cdn.acme.test/public/a%20b.png");
    expect(() => disk(null).url("public/a.png")).toThrow(/filesystem\.url/);
  });

  it("presigns a GET for a temporary URL, in whole seconds", async () => {
    fakeCredentials();
    const link = new URL(await disk().temporaryUrl("private/invoices/a.pdf", Duration.minutes(5)));
    expect(link.pathname).toBe("/private/invoices/a.pdf");
    expect(link.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(link.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `GuardDutyFileScannerDriver`: each GuardDuty status mapped to a verdict, with no tag as
 *          `pending`; the tag read pinned to the version the head saw; a clean tag called `clean` only when the object
 *          it sits on is the caller's bytes (by `VersionId` in a versioned bucket, by `If-Match` on the ETag and the
 *          same last write in an unversioned one), and `pending` when the object was written again under the caller
 *          (STA-669); a config without a bucket is refused.
 * Boundary: test only; `S3Client.prototype.send` is replaced by an in-memory object, so no request leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0354; ADR 0222; STA-669.
 */
import {
  GetObjectCommand,
  GetObjectTaggingCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { buildConfig } from "@stackra/config";
import { FilesystemConfig } from "@stackra/filesystem";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { GuardDutyFileScannerDriver } from "#node/drivers/guard-duty-file-scanner.driver";

/** The bytes the caller read and will place. */
const SCANNED = new TextEncoder().encode("%PDF-1.7 the scanned bytes");

/** Other bytes of the same length: what a second PUT through the signed URL left at the key. */
const REPLACED = new TextEncoder().encode("%PDF-1.7 the swapped bytes");

/** When the head saw the object written. */
const WRITTEN = new Date("2026-11-27T08:00:00Z");

/** What the fake bucket holds at the key, and how it answers. */
type FakeObject = {
  /** The tag status GuardDuty wrote, none when undefined. */
  status?: string | undefined;
  /** The head's version (`undefined` or `"null"` in an unversioned bucket). */
  version?: string | undefined;
  /** The bytes a GET of the pinned object returns. */
  body?: Uint8Array | undefined;
  /** The last write a GET reports; the head's by default. */
  getLastModified?: Date | undefined;
  /** What a GET throws instead of answering. */
  getError?: unknown;
};

/** The scanner over `acme-files`, its S3 calls, and the destroy spy of the GET body. */
function scanner(object: FakeObject) {
  const destroy = vi.fn();
  const send = vi.spyOn(S3Client.prototype, "send").mockImplementation((async (
    command: unknown,
  ) => {
    if (command instanceof HeadObjectCommand)
      return {
        ETag: '"etag-1"',
        LastModified: WRITTEN,
        ContentLength: SCANNED.byteLength,
        ...(object.version === undefined ? {} : { VersionId: object.version }),
      };
    if (command instanceof GetObjectTaggingCommand)
      return {
        TagSet:
          object.status === undefined
            ? []
            : [{ Key: "GuardDutyMalwareScanStatus", Value: object.status }],
      };
    if (command instanceof GetObjectCommand) {
      if (object.getError !== undefined) throw object.getError;
      const body = object.body ?? SCANNED;
      return {
        LastModified: object.getLastModified ?? WRITTEN,
        Body: { transformToByteArray: async () => body, destroy },
      };
    }
    throw new Error("unexpected command");
  }) as never);
  const driver = new GuardDutyFileScannerDriver(
    buildConfig(FilesystemConfig, {
      values: {
        s3: { bucket: "acme-files", region: "me-central-1", endpoint: null, forcePathStyle: false },
      },
    }),
  );
  /** The inputs of the commands sent, by command name. */
  const inputs = (type: new (...args: never[]) => { input: unknown }) =>
    send.mock.calls
      .map(([command]) => command)
      .filter((command) => command instanceof type)
      .map((command) => (command as { input: unknown }).input);
  return { driver, send, inputs, destroy };
}

/** The caller's read of `bytes`, counting its calls. */
function reader(bytes: Uint8Array = SCANNED) {
  return vi.fn(async () => bytes);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GuardDutyFileScannerDriver", () => {
  it("calls a file clean when the tagged version holds the caller's bytes", async () => {
    const { driver, inputs } = scanner({ status: "NO_THREATS_FOUND", version: "v2" });
    expect(await driver.scan("uploads/upl_1", reader())).toEqual({ verdict: "clean", threats: [] });
    expect(inputs(HeadObjectCommand)).toEqual([{ Bucket: "acme-files", Key: "uploads/upl_1" }]);
    expect(inputs(GetObjectTaggingCommand)).toEqual([
      { Bucket: "acme-files", Key: "uploads/upl_1", VersionId: "v2" },
    ]);
    expect(inputs(GetObjectCommand)).toEqual([
      { Bucket: "acme-files", Key: "uploads/upl_1", VersionId: "v2" },
    ]);
  });

  it.each([undefined, "null"])(
    "pins an unversioned object (version %s) by its ETag",
    async (version) => {
      const { driver, inputs } = scanner({ status: "NO_THREATS_FOUND", version });
      expect(await driver.scan("uploads/upl_1", reader())).toEqual({
        verdict: "clean",
        threats: [],
      });
      expect(inputs(GetObjectTaggingCommand)).toEqual([
        { Bucket: "acme-files", Key: "uploads/upl_1" },
      ]);
      expect(inputs(GetObjectCommand)).toEqual([
        { Bucket: "acme-files", Key: "uploads/upl_1", IfMatch: '"etag-1"' },
      ]);
    },
  );

  it("is pending, never clean, when the clean tag sits on other bytes than the caller's", async () => {
    // the caller read SCANNED; the key was written again with REPLACED, which GuardDuty tagged clean
    const { driver } = scanner({ status: "NO_THREATS_FOUND", version: "v3", body: REPLACED });
    expect(await driver.scan("uploads/upl_1", reader())).toEqual({
      verdict: "pending",
      threats: [],
    });
  });

  it("is pending when the caller's bytes are not the size of the tagged object, without reading it", async () => {
    const { driver, inputs } = scanner({ status: "NO_THREATS_FOUND", version: "v2" });
    const read = reader(new TextEncoder().encode("%PDF-1.7 shorter"));
    expect(await driver.scan("uploads/upl_1", read)).toEqual({ verdict: "pending", threats: [] });
    expect(inputs(GetObjectCommand)).toEqual([]);
  });

  it("is pending when an unversioned object was written again since the head (If-Match fails)", async () => {
    const changed = Object.assign(
      new Error("At least one of the pre-conditions you specified did not hold"),
      {
        name: "PreconditionFailed",
        $metadata: { httpStatusCode: 412 },
      },
    );
    const { driver } = scanner({ status: "NO_THREATS_FOUND", getError: changed });
    expect(await driver.scan("uploads/upl_1", reader())).toEqual({
      verdict: "pending",
      threats: [],
    });
  });

  it("is pending when an unversioned object was written again with the same ETag, and frees the body", async () => {
    const { driver, destroy } = scanner({
      status: "NO_THREATS_FOUND",
      getLastModified: new Date("2026-11-27T08:00:05Z"),
    });
    expect(await driver.scan("uploads/upl_1", reader())).toEqual({
      verdict: "pending",
      threats: [],
    });
    expect(destroy).toHaveBeenCalledOnce();
  });

  it("rethrows a read that fails for another reason", async () => {
    const { driver } = scanner({
      status: "NO_THREATS_FOUND",
      version: "v2",
      getError: Object.assign(new Error("Access Denied"), {
        name: "AccessDenied",
        $metadata: { httpStatusCode: 403 },
      }),
    });
    await expect(driver.scan("uploads/upl_1", reader())).rejects.toThrow("Access Denied");
  });

  it("maps every other status without reading the bytes", async () => {
    for (const [status, verdict] of [
      ["THREATS_FOUND", { verdict: "infected", threats: ["THREATS_FOUND"] }],
      [undefined, { verdict: "pending", threats: [] }],
      ["UNSUPPORTED", { verdict: "failed", threats: [], detail: "UNSUPPORTED" }],
    ] as const) {
      const { driver, inputs } = scanner({ status, version: "v1" });
      const read = reader();
      expect(await driver.scan("a", read)).toEqual(verdict);
      expect(read).not.toHaveBeenCalled();
      expect(inputs(GetObjectCommand)).toEqual([]);
      vi.restoreAllMocks();
    }
  });

  it("refuses a config without a bucket", () => {
    expect(() => new GuardDutyFileScannerDriver(buildConfig(FilesystemConfig))).toThrow(
      /s3\.bucket/,
    );
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `GuardDutyFileScannerDriver`: the tag request it sends, and each GuardDuty status mapped to a
 *          verdict, with no tag as `pending`; a config without a bucket is refused.
 * Boundary: test only; `S3Client.prototype.send` is replaced, so no request leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0354.
 */
import { GetObjectTaggingCommand, S3Client } from "@aws-sdk/client-s3";
import { buildConfig } from "@stackra/config";
import { FilesystemConfig } from "@stackra/filesystem";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { GuardDutyFileScannerDriver } from "#node/drivers/guard-duty-file-scanner.driver";

/** The scanner over `acme-files`, answering with the tag `status` (none when undefined). */
function scanner(status: string | undefined) {
  const send = vi.spyOn(S3Client.prototype, "send").mockImplementation((async () => ({
    TagSet: status === undefined ? [] : [{ Key: "GuardDutyMalwareScanStatus", Value: status }],
  })) as never);
  const driver = new GuardDutyFileScannerDriver(
    buildConfig(FilesystemConfig, {
      values: {
        s3: { bucket: "acme-files", region: "me-central-1", endpoint: null, forcePathStyle: false },
      },
    }),
  );
  return { driver, send };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GuardDutyFileScannerDriver", () => {
  it("reads the scan status tag of the object", async () => {
    const { driver, send } = scanner("NO_THREATS_FOUND");
    expect(await driver.scan("private/a/b.pdf")).toEqual({ verdict: "clean", threats: [] });
    const command = send.mock.calls[0]?.[0];
    expect(command).toBeInstanceOf(GetObjectTaggingCommand);
    expect((command as GetObjectTaggingCommand).input).toEqual({
      Bucket: "acme-files",
      Key: "private/a/b.pdf",
    });
  });

  it("maps every status", async () => {
    expect(await scanner("THREATS_FOUND").driver.scan("a")).toMatchObject({ verdict: "infected" });
    expect(await scanner(undefined).driver.scan("a")).toEqual({ verdict: "pending", threats: [] });
    expect(await scanner("UNSUPPORTED").driver.scan("a")).toEqual({
      verdict: "failed",
      threats: [],
      detail: "UNSUPPORTED",
    });
  });

  it("refuses a config without a bucket", () => {
    expect(() => new GuardDutyFileScannerDriver(buildConfig(FilesystemConfig))).toThrow(
      /s3\.bucket/,
    );
  });
});

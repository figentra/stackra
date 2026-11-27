/**
 * Stackra file contract:
 * Purpose: integration tests of `GuardDutyFileScannerDriver` on a real S3 API: the verdict GuardDuty tags on an object
 *          is pinned to the version the head saw, and a clean tag is `clean` only for the caller's bytes; an
 *          unversioned bucket is refused; a key written again under the caller (a second PUT
 *          through the still-valid signed upload URL, then tagged clean) is `pending`. `MediaLibrary.claim` over the
 *          `s3` disk then places nothing on that first claim and, claimed again, places the bytes GuardDuty tagged
 *          (STA-669).
 * Boundary: test only; S3 is a Testcontainers LocalStack (`SERVICES=s3`, its fixed `test` credentials, no AWS account);
 *           GuardDuty Malware Protection does not run there, so the test writes its `GuardDutyMalwareScanStatus` tag
 *           with `PutObjectTagging` as GuardDuty would. Docker and the image are needed.
 * Runtime: node (vitest, int tier)
 * Governing contract: ADR 0182 (test tiers); ADR 0222 (an unscanned file is never served); ADR 0354 (GuardDuty in
 *                     region); STA-669.
 */
import {
  CreateBucketCommand,
  PutBucketVersioningCommand,
  PutObjectCommand,
  PutObjectTaggingCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { buildConfig } from "@stackra/config";
import { Clock } from "@stackra/contracts";
import { FilesystemConfig } from "@stackra/filesystem";
import { S3FileSystemDriver } from "@stackra/filesystem/node";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";
import { GenericContainer, type StartedTestContainer, Wait } from "testcontainers";

import { MediaConfig } from "#config/media.config";
import { ScanVerdict } from "#contracts/enums/scan-verdict.enum";
import { FileScanner } from "#contracts/ports/file-scanner.port";
import type { ScanResult } from "#contracts/types/scan-result.type";
import { Bucket } from "#core/bases/bucket.base";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import { MediaType } from "#core/enums/media-type.enum";
import { ScanPendingError } from "#core/errors/scan-pending.error";
import { MediaLibrary } from "#core/services/media-library.service";
import { GuardDutyFileScannerDriver } from "#node/drivers/guard-duty-file-scanner.driver";

/** The S3 emulator, pinned. */
const IMAGE = "localstack/localstack:4.4.0";

/** LocalStack's region. */
const REGION = "us-east-1";

/** The tag GuardDuty Malware Protection for S3 writes. */
const STATUS_TAG = "GuardDutyMalwareScanStatus";

/** What the caller read: the bytes a claim will place. */
const FIRST = new TextEncoder().encode("%PDF-1.7\n% the bytes the claim read\n%%EOF\n");

/** What a second PUT through the signed URL leaves at the key, the same length as `FIRST`. */
const SECOND = new TextEncoder().encode("%PDF-1.7\n% the bytes put after them\n%%EOF\n");

/** The wall clock: the emulator stamps its objects with the real time. */
class WallClock extends Clock {
  now(): Date {
    return new Date();
  }
}

class InvoicesBucket extends Bucket({
  visibility: BucketVisibility.Private,
  maxBytes: 10_000,
  accept: [MediaType.Pdf],
}) {}

let s3: StartedTestContainer;

let endpoint: string;

let admin: S3Client;

/** The filesystem configuration of `bucket` on the emulator. */
function filesOf(bucket: string): FilesystemConfig {
  return buildConfig(FilesystemConfig, {
    values: {
      disk: "s3",
      url: "https://cdn.test",
      s3: { bucket, region: REGION, endpoint, forcePathStyle: true },
    },
  });
}

/** Creates `bucket`, versioned when asked. */
async function createBucket(bucket: string, versioned: boolean): Promise<void> {
  await admin.send(new CreateBucketCommand({ Bucket: bucket }));
  if (versioned)
    await admin.send(
      new PutBucketVersioningCommand({
        Bucket: bucket,
        VersioningConfiguration: { Status: "Enabled" },
      }),
    );
}

/** Puts `bytes` at `key`, as a browser's signed PUT does, and returns the version S3 gave it. */
async function put(bucket: string, key: string, bytes: Uint8Array): Promise<string | undefined> {
  const { VersionId } = await admin.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: MediaType.Pdf }),
  );
  return VersionId;
}

/** Tags the object (a version of it, when given) with `status`, as GuardDuty does once it has scanned it. */
async function tag(bucket: string, key: string, status: string, version?: string): Promise<void> {
  await admin.send(
    new PutObjectTaggingCommand({
      Bucket: bucket,
      Key: key,
      ...(version === undefined ? {} : { VersionId: version }),
      Tagging: { TagSet: [{ Key: STATUS_TAG, Value: status }] },
    }),
  );
}

beforeAll(async () => {
  s3 = await new GenericContainer(IMAGE)
    .withEnvironment({ SERVICES: "s3" })
    .withExposedPorts(4566)
    .withWaitStrategy(Wait.forLogMessage("Ready."))
    .withStartupTimeout(240_000)
    .start();
  endpoint = `http://${s3.getHost()}:${s3.getMappedPort(4566)}`;
  // LocalStack's fixed dummy credentials, read by the SDK's default chain like a deployment's role
  delete process.env["AWS_PROFILE"];
  process.env["AWS_ACCESS_KEY_ID"] = "test";
  process.env["AWS_SECRET_ACCESS_KEY"] = "test";
  admin = new S3Client({ region: REGION, endpoint, forcePathStyle: true });
}, 300_000);

afterAll(async () => {
  admin?.destroy();
  await s3?.stop();
});

describe("the guard_duty scanner on a real S3 API (STA-669)", () => {
  it("calls the caller's bytes clean once GuardDuty tagged their version", async () => {
    await createBucket("versioned-clean", true);
    const scanner = new GuardDutyFileScannerDriver(filesOf("versioned-clean"));
    const version = await put("versioned-clean", "uploads/upl_1", FIRST);
    expect(version).toBeTruthy();

    expect(await scanner.scan("uploads/upl_1", async () => FIRST)).toEqual({
      verdict: ScanVerdict.Pending,
      threats: [],
    });
    await tag("versioned-clean", "uploads/upl_1", "NO_THREATS_FOUND", version);
    expect(await scanner.scan("uploads/upl_1", async () => FIRST)).toEqual({
      verdict: ScanVerdict.Clean,
      threats: [],
    });
  });

  it("is pending when the clean tag sits on a later version than the caller's bytes", async () => {
    await createBucket("versioned-swap", true);
    const scanner = new GuardDutyFileScannerDriver(filesOf("versioned-swap"));
    await put("versioned-swap", "uploads/upl_2", FIRST); // the caller read these
    const later = await put("versioned-swap", "uploads/upl_2", SECOND);
    await tag("versioned-swap", "uploads/upl_2", "NO_THREATS_FOUND", later);

    expect(await scanner.scan("uploads/upl_2", async () => FIRST)).toEqual({
      verdict: ScanVerdict.Pending,
      threats: [],
    });
    expect(await scanner.scan("uploads/upl_2", async () => SECOND)).toEqual({
      verdict: ScanVerdict.Clean,
      threats: [],
    });
  });

  it("never reads the clean tag of an earlier version for the current one", async () => {
    await createBucket("versioned-stale", true);
    const scanner = new GuardDutyFileScannerDriver(filesOf("versioned-stale"));
    const earlier = await put("versioned-stale", "uploads/upl_3", SECOND);
    await tag("versioned-stale", "uploads/upl_3", "NO_THREATS_FOUND", earlier);
    await put("versioned-stale", "uploads/upl_3", FIRST); // not scanned yet

    expect(await scanner.scan("uploads/upl_3", async () => FIRST)).toEqual({
      verdict: ScanVerdict.Pending,
      threats: [],
    });
  });

  it("refuses an unversioned bucket, even for a clean tag on the caller's bytes", async () => {
    await createBucket("plain", false);
    const scanner = new GuardDutyFileScannerDriver(filesOf("plain"));
    await put("plain", "uploads/upl_4", SECOND);
    await tag("plain", "uploads/upl_4", "NO_THREATS_FOUND");

    await expect(scanner.scan("uploads/upl_4", async () => SECOND)).rejects.toThrow(
      /needs a versioned bucket/,
    );
  });

  it("reports THREATS_FOUND on the current version as infected", async () => {
    await createBucket("infected", true);
    const scanner = new GuardDutyFileScannerDriver(filesOf("infected"));
    const version = await put("infected", "uploads/upl_5", FIRST);
    await tag("infected", "uploads/upl_5", "THREATS_FOUND", version);

    expect(await scanner.scan("uploads/upl_5", async () => FIRST)).toEqual({
      verdict: ScanVerdict.Infected,
      threats: ["THREATS_FOUND"],
    });
  });

  it("claims nothing when the key is written again under the claim, then places the bytes GuardDuty tagged", async () => {
    await createBucket("media-files", true);
    const files = filesOf("media-files");
    const disk = new S3FileSystemDriver(files);
    const guardDuty = new GuardDutyFileScannerDriver(files);
    let swapped = false;
    /** Between the claim's read and its scan, a second PUT through the signed URL, which GuardDuty then tags clean. */
    const scanner = new (class extends FileScanner {
      async scan(path: string, read: () => Promise<Uint8Array>): Promise<ScanResult> {
        if (!swapped) {
          swapped = true;
          const version = await put("media-files", path, SECOND);
          await tag("media-files", path, "NO_THREATS_FOUND", version);
        }
        return guardDuty.scan(path, read);
      }
    })();
    const config = buildConfig(MediaConfig, { values: { scanner: "guard_duty" } });
    const media = new MediaLibrary(disk, config, new WallClock(), scanner);
    const pending = await media.createUpload(InvoicesBucket, {
      mediaType: MediaType.Pdf,
      size: FIRST.byteLength,
    });
    const staged = `uploads/${pending.upload.id}`;
    await put("media-files", staged, FIRST);

    await expect(media.claim(pending.upload, InvoicesBucket)).rejects.toBeInstanceOf(
      ScanPendingError,
    );
    const path = `private/invoices/${pending.upload.id}.pdf`;
    expect(await disk.exists(path)).toBe(false);

    const file = await media.claim(pending.upload, InvoicesBucket);
    expect(file).toMatchObject({ path, scan: ScanVerdict.Clean });
    expect(await disk.read(path)).toEqual(SECOND);
    expect(await disk.exists(staged)).toBe(false);
  });
});

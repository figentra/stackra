/**
 * Stackra file contract:
 * Purpose: the `guard_duty` driver of `FileScanner`: reads the verdict AWS GuardDuty Malware Protection for S3 writes
 *          on the object as the `GuardDutyMalwareScanStatus` tag, for the regions where GuardDuty is offered, and calls
 *          a file clean only when that tag belongs to the very bytes the caller will place or link (STA-669).
 * Boundary: GuardDuty scans the object in place when it lands in the protected bucket (the infrastructure package
 *           turns the protection plan on, STA-2912); this driver never sends bytes. The bucket must be versioned: the
 *           tag sits on one object version, and the key can be written again through a still-valid signed upload URL
 *           while a claim runs, so the verdict is pinned to the version the head saw. An object with no version (an
 *           unversioned or suspended bucket) is refused with a `TypeError` naming the setting, before any tag is read:
 *           the caller keeps the upload, and nothing is placed or linked until versioning is on. The driver reads the
 *           tag of that version and, for a clean tag, reads that same version back and compares it with the caller's
 *           bytes (`read`). A tag of another version, or bytes that differ from the caller's, are `pending`, never
 *           `clean`: the caller claims again, reads the object anew and gets the verdict on those bytes. No tag yet is
 *           `pending`. `NO_THREATS_FOUND` (on the caller's bytes) is `clean`, `THREATS_FOUND` is `infected`, any other
 *           status (`UNSUPPORTED`, `ACCESS_DENIED`, `FAILED`) is `failed` with the status as its detail. The bucket is
 *           `filesystem.s3.bucket`, the one `S3FileSystemDriver` of @stackra/filesystem writes (media stores there
 *           since ADR 0465); credentials are the SDK's chain and need `s3:GetObject`, `s3:GetObjectVersion` and
 *           `s3:GetObjectVersionTagging`. A clean verdict reads the object once more, bounded by the size the caller
 *           already holds.
 * Runtime: node
 * Governing contract: ADR 0354 (GuardDuty in region); ADR 0222 (an unscanned file is never served); ADR 0173 (no
 *                     credential in config); OS-142; STA-669.
 */
import { Buffer } from "node:buffer";

import {
  GetObjectCommand,
  GetObjectTaggingCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Driver } from "@stackra/container";
import type { HeadObjectCommandOutput } from "@aws-sdk/client-s3";
import type { FilesystemConfig } from "@stackra/filesystem";

import { ScanVerdict } from "#contracts/enums/scan-verdict.enum";
import { FileScanner } from "#contracts/ports/file-scanner.port";
import type { ScanResult } from "#contracts/types/scan-result.type";

/** The tag GuardDuty writes its scan status to. */
const STATUS_TAG = "GuardDutyMalwareScanStatus";

/** GuardDuty has not decided on these bytes yet, or the object changed under the caller. */
const PENDING: ScanResult = { verdict: ScanVerdict.Pending, threats: [] };

/** Why an object with no version is refused: the verdict cannot be pinned to the bytes it was given for. */
const UNVERSIONED =
  "The guard_duty scanner needs a versioned bucket: turn versioning on for filesystem.s3.bucket " +
  "(runway shared.buckets.versioning), so GuardDuty's verdict is pinned to the version it scanned";

/**
 * Reads GuardDuty's verdict from the object's tags, pinned to the caller's bytes.
 *
 * @example
 * // runway.yaml (uae): config.filesystem: { disk: s3 }; config.media: { scanner: guard_duty }
 */
export class GuardDutyFileScannerDriver extends Driver(FileScanner) {
  /** The client every call goes through. */
  readonly client: S3Client;

  private readonly bucket: string;

  /**
   * @param files - the shared bucket, region, endpoint and addressing (`s3`).
   * @throws TypeError when `s3.bucket` is empty.
   */
  constructor(files: FilesystemConfig) {
    super();
    const { bucket, region, endpoint, forcePathStyle } = files.s3;
    if (bucket === "")
      throw new TypeError("The guard_duty scanner needs a bucket: set `filesystem.s3.bucket`");
    this.bucket = bucket;
    this.client = new S3Client({
      region,
      forcePathStyle,
      ...(endpoint === null ? {} : { endpoint }),
    });
  }

  /**
   * The verdict GuardDuty tagged the object at `path` with: `clean` only when the tagged object is the bytes `read`
   * gives; `pending` before GuardDuty has tagged it, or when the object changed since the caller read it.
   *
   * @throws TypeError when the object has no version: the bucket is not versioned.
   * @throws Error when S3 cannot be reached or refuses the request (no object, no permission).
   */
  async scan(path: string, read: () => Promise<Uint8Array>): Promise<ScanResult> {
    const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: path }));
    // a versioned bucket names the version; an unversioned one answers no version or the literal "null"
    const version = head.VersionId;
    if (version === undefined || version === "null") throw new TypeError(UNVERSIONED);
    const { TagSet = [] } = await this.client.send(
      new GetObjectTaggingCommand({ Bucket: this.bucket, Key: path, VersionId: version }),
    );
    const status = TagSet.find((tag) => tag.Key === STATUS_TAG)?.Value;
    if (status === undefined) return PENDING;
    if (status === "THREATS_FOUND") return { verdict: ScanVerdict.Infected, threats: [status] };
    if (status !== "NO_THREATS_FOUND")
      return { verdict: ScanVerdict.Failed, threats: [], detail: status };
    return (await this.isTaggedObject(path, head, version, await read()))
      ? { verdict: ScanVerdict.Clean, threats: [] }
      : PENDING;
  }

  /** Whether the version the head saw still holds exactly `bytes`. */
  private async isTaggedObject(
    path: string,
    head: Pick<HeadObjectCommandOutput, "ContentLength">,
    version: string,
    bytes: Uint8Array,
  ): Promise<boolean> {
    if (head.ContentLength !== undefined && head.ContentLength !== bytes.byteLength) return false;
    const object = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: path, VersionId: version }),
    );
    const tagged = await object.Body?.transformToByteArray();
    return tagged !== undefined && Buffer.compare(tagged, bytes) === 0;
  }
}

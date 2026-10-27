/**
 * Stackra file contract:
 * Purpose: the `guard_duty` driver of `FileScanner`: reads the verdict AWS GuardDuty Malware Protection for S3 writes
 *          on the object as the `GuardDutyMalwareScanStatus` tag, for the regions where GuardDuty is offered.
 * Boundary: GuardDuty scans the object in place when it lands in the protected bucket (the infrastructure package
 *           turns the protection plan on); this driver never sends bytes. No tag yet is `pending`: the caller asks
 *           again or waits for GuardDuty's event. `NO_THREATS_FOUND` is `clean`, `THREATS_FOUND` is `infected`, any
 *           other status (`UNSUPPORTED`, `ACCESS_DENIED`, `FAILED`) is `failed` with the status as its detail. The
 *           bucket is `filesystem.s3.bucket`, the one `S3FileSystemDriver` of @stackra/filesystem writes (media stores
 *           there since ADR 0465); credentials are the SDK's chain.
 * Runtime: node
 * Governing contract: ADR 0354 (GuardDuty in region); ADR 0222; ADR 0173 (no credential in config); OS-142.
 */
import { GetObjectTaggingCommand, S3Client } from "@aws-sdk/client-s3";
import { Driver } from "@stackra/container";
import type { FilesystemConfig } from "@stackra/filesystem";

import { ScanVerdict } from "#contracts/enums/scan-verdict.enum";
import { FileScanner } from "#contracts/ports/file-scanner.port";
import type { ScanResult } from "#contracts/types/scan-result.type";

/** The tag GuardDuty writes its scan status to. */
const STATUS_TAG = "GuardDutyMalwareScanStatus";

/**
 * Reads GuardDuty's verdict from the object's tags.
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

  /** The verdict GuardDuty tagged the object at `path` with; `pending` before it has. */
  async scan(path: string): Promise<ScanResult> {
    const { TagSet = [] } = await this.client.send(
      new GetObjectTaggingCommand({ Bucket: this.bucket, Key: path }),
    );
    const status = TagSet.find((tag) => tag.Key === STATUS_TAG)?.Value;
    if (status === undefined) return { verdict: ScanVerdict.Pending, threats: [] };
    if (status === "NO_THREATS_FOUND") return { verdict: ScanVerdict.Clean, threats: [] };
    if (status === "THREATS_FOUND") return { verdict: ScanVerdict.Infected, threats: [status] };
    return { verdict: ScanVerdict.Failed, threats: [], detail: status };
  }
}

/**
 * Stackra file contract:
 * Purpose: the S3-compatible `MediaDisk` (`disk: "s3"`): AWS S3, Cloudflare R2 or MinIO, in the shared bucket of
 *          `filesystem.s3`. Uploads are SigV4 presigned `PUT`s that sign the content type and keep the metadata as
 *          signed headers; a claim's move is a server-side copy and delete.
 * Boundary: holds no credential: the AWS SDK reads its default chain (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`,
 *           which runway syncs from Infisical, or an instance role). The metadata headers are left unhoisted, so they
 *           stay signed headers the client must send unchanged (S3 refuses a changed one); the bucket's CORS rule must
 *           allow `content-type` and `x-amz-meta-*` on `PUT`. The size is not signed (a browser sets Content-Length
 *           itself): `MediaLibrary.claim` checks it. A missing object is `null` from `stat` and a `FileNotFoundError`
 *           from `move`; any other store error is rethrown as it is.
 * Runtime: node
 * Governing contract: ADR 0222 (decisions 1 to 3); ADR 0173 (secrets); ADR 0294 (decision 16).
 */
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { FilesystemConfig } from "@stackra/filesystem";
import { FileNotFoundError } from "@stackra/filesystem";

import { MediaDisk } from "#contracts/ports/media-disk.port";
import type { MediaObject } from "#contracts/types/media-object.type";
import type { SignedUpload } from "#contracts/types/signed-upload.type";
import type { UploadRequest } from "#contracts/types/upload-request.type";
import { mediaUrl } from "#core/functions/media-url.function";

/** The header prefix S3 stores user metadata under. */
const METADATA_HEADER = "x-amz-meta-";

/** Whether a store error means the object is not there (`NoSuchKey`, `NotFound` or a 404). */
function isNotFound(error: unknown): boolean {
  const failure = error as { name?: unknown; $metadata?: { httpStatusCode?: unknown } } | null;
  return (
    failure?.name === "NoSuchKey" ||
    failure?.name === "NotFound" ||
    failure?.$metadata?.httpStatusCode === 404
  );
}

/** Whole seconds of `duration`, rounded up, as the presigner takes them. */
const secondsOf = (duration: Duration): number =>
  Math.ceil(Duration.toMilliseconds(duration) / 1000);

/**
 * Keeps media in an S3-compatible bucket.
 *
 * @example
 * // runway.yaml (staging): config.media: { disk: s3 }; config.filesystem: { s3: { bucket: acme-files, ... } }
 * const target = await disk.signUpload("uploads/upl_01…", request);
 */
export class S3MediaDiskDriver extends Driver(MediaDisk) {
  /** The client every call goes through. */
  readonly client: S3Client;

  private readonly bucket: string;

  private readonly base: string | null;

  /**
   * @param files - the shared bucket, region, endpoint and addressing (`s3`) and the public base URL (`url`).
   * @throws TypeError when `s3.bucket` is empty.
   */
  constructor(files: FilesystemConfig) {
    super();
    const { bucket, region, endpoint, forcePathStyle } = files.s3;
    if (bucket === "")
      throw new TypeError("The s3 media disk needs a bucket: set `filesystem.s3.bucket`");
    this.bucket = bucket;
    this.base = files.url;
    this.client = new S3Client({
      region,
      forcePathStyle,
      // A presigned PUT must not carry a checksum computed over the empty body at signing time.
      requestChecksumCalculation: "WHEN_REQUIRED",
      ...(endpoint === null ? {} : { endpoint }),
    });
  }

  /**
   * A presigned `PUT` of `path`, valid for `expiresIn` rounded up to whole seconds.
   *
   * @throws Error when `expiresIn` is longer than seven days (the SigV4 limit).
   */
  async signUpload(path: string, request: UploadRequest): Promise<SignedUpload> {
    const headers: Record<string, string> = { "content-type": request.contentType };
    for (const [name, value] of Object.entries(request.metadata))
      headers[`${METADATA_HEADER}${name}`] = value;
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        ContentType: request.contentType,
        Metadata: { ...request.metadata },
      }),
      {
        expiresIn: secondsOf(request.expiresIn),
        signableHeaders: new Set(["content-type"]),
        unhoistableHeaders: new Set(Object.keys(headers).filter((name) => name !== "content-type")),
      },
    );
    return { url, method: "PUT", headers };
  }

  /** The size, content type and metadata of the object at `path` (a HEAD request), or `null`. */
  async stat(path: string): Promise<MediaObject | null> {
    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: path }),
      );
      return {
        size: head.ContentLength ?? 0,
        contentType: head.ContentType ?? null,
        metadata: { ...head.Metadata },
      };
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  /** Copies the object at `from` to `to` inside the bucket, keeping its content type and metadata, then deletes it. */
  async move(from: string, to: string): Promise<void> {
    try {
      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          Key: to,
          CopySource: `${this.bucket}/${from.split("/").map(encodeURIComponent).join("/")}`,
        }),
      );
    } catch (error) {
      throw isNotFound(error) ? new FileNotFoundError(from) : error;
    }
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: from }));
  }

  /** Removes the object at `path`; false when there was none (S3's DELETE does not say, so it asks first). */
  async delete(path: string): Promise<boolean> {
    if ((await this.stat(path)) === null) return false;
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: path }));
    return true;
  }

  /**
   * The configured base URL (the CDN in front of the bucket) followed by the path.
   *
   * @throws TypeError when `filesystem.url` is not set.
   */
  url(path: string): string {
    if (this.base === null)
      throw new TypeError("The s3 media disk has no public URL: set `filesystem.url`");
    return mediaUrl(this.base, path);
  }

  /**
   * A presigned GET of `path`, valid for `expiresIn` rounded up to whole seconds.
   *
   * @throws Error when `expiresIn` is longer than seven days (the SigV4 limit).
   */
  async temporaryUrl(path: string, expiresIn: Duration): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: path }), {
      expiresIn: secondsOf(expiresIn),
    });
  }
}

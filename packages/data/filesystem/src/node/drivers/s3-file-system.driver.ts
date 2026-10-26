/**
 * Stackra file contract:
 * Purpose: the S3-compatible `FileSystem` (`disk: "s3"`): AWS S3, Cloudflare R2 or MinIO, chosen by
 *          `filesystem.s3.{region, endpoint, forcePathStyle}`. Temporary URLs are SigV4 presigned GETs. A streamed write
 *          is a multipart upload in 8 MiB parts and a streamed read is the GET body as a web stream, so a large export or
 *          import never sits in memory whole.
 * Boundary: holds no credential: the AWS SDK reads its default chain (`AWS_ACCESS_KEY_ID` and
 *           `AWS_SECRET_ACCESS_KEY`, which runway syncs from Infisical, or an instance role). Every key passes
 *           `normalizePath`. A missing object is a `FileNotFoundError`; any other store error is rethrown as it is. Every
 *           part but the last is exactly `PART_SIZE` (R2 needs equal parts; S3 needs at least 5 MiB), a stream shorter
 *           than one part is one PUT, and a failed upload is aborted so no part is left billed or visible.
 * Runtime: node
 * Governing contract: ADR 0222 (decision 1: S3, R2 and MinIO drivers); ADR 0234 (decision 7); ADR 0173 (secrets);
 *                     ADR 0294 (decision 16); ADR 0413 (streamed writes).
 */
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import type { FilesystemConfig } from "#config/filesystem.config";
import { FileSystem } from "#contracts/ports/file-system.port";
import { byteChunks } from "#contracts/functions/byte-chunks.function";
import { concatBytes } from "#contracts/functions/concat-bytes.function";
import type { FileStat } from "#contracts/types/file-stat.type";
import type { WriteOptions } from "#contracts/types/write-options.type";
import type { WriteStreamSource } from "#contracts/types/write-stream-source.type";
import { FileNotFoundError } from "#core/errors/file-not-found.error";
import { normalizePath } from "#core/functions/normalize-path.function";
import { normalizePrefix } from "#core/functions/normalize-prefix.function";
import { publicUrl } from "#core/functions/public-url.function";

/** The size of every part of a multipart upload but the last: above S3's 5 MiB floor, equal as R2 requires. */
const PART_SIZE = 8 * 1024 * 1024;

/** Whether a store error means the object is not there (`NoSuchKey` from GET, `NotFound` or 404 from HEAD). */
function isNotFound(error: unknown): boolean {
  const failure = error as { name?: unknown; $metadata?: { httpStatusCode?: unknown } } | null;
  return (
    failure?.name === "NoSuchKey" ||
    failure?.name === "NotFound" ||
    failure?.$metadata?.httpStatusCode === 404
  );
}

/**
 * Keeps files in an S3-compatible bucket.
 *
 * @example
 * // runway.yaml (staging): config.filesystem: { disk: s3, s3: { bucket: acme-files, region: auto, endpoint: ... } }
 * const link = await files.temporaryUrl("exports/orders.csv", Duration.minutes(10));
 */
export class S3FileSystemDriver extends Driver(FileSystem) {
  /** The client every call goes through. */
  readonly client: S3Client;

  private readonly bucket: string;

  private readonly base: string | null;

  /**
   * @param config - the bucket, region, endpoint and addressing (`s3`) and the public base URL (`url`).
   * @throws TypeError when `s3.bucket` is empty.
   */
  constructor(config: FilesystemConfig) {
    super();
    const { bucket, region, endpoint, forcePathStyle } = config.s3;
    if (bucket === "")
      throw new TypeError("The s3 disk needs a bucket: set `filesystem.s3.bucket`");
    this.bucket = bucket;
    this.base = config.url;
    this.client = new S3Client({
      region,
      forcePathStyle,
      ...(endpoint === null ? {} : { endpoint }),
    });
  }

  /** Whether an object is stored under `path` (a HEAD request). */
  async exists(path: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: normalizePath(path) }),
      );
      return true;
    } catch (error) {
      if (isNotFound(error)) return false;
      throw error;
    }
  }

  /** The bytes of the object under `path`. */
  async read(path: string): Promise<Uint8Array> {
    const key = normalizePath(path);
    try {
      const output = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (output.Body === undefined) throw new FileNotFoundError(key);
      return await output.Body.transformToByteArray();
    } catch (error) {
      throw isNotFound(error) ? new FileNotFoundError(key) : error;
    }
  }

  /** The object under `path` as the GET response body, streamed; a missing object rejects before the stream. */
  override async readStream(path: string): Promise<ReadableStream<Uint8Array>> {
    const key = normalizePath(path);
    try {
      const output = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (output.Body === undefined) throw new FileNotFoundError(key);
      return output.Body.transformToWebStream() as ReadableStream<Uint8Array>;
    } catch (error) {
      throw isNotFound(error) ? new FileNotFoundError(key) : error;
    }
  }

  /** Puts `contents` under `path`; S3 replaces an object atomically. */
  async write(path: string, contents: Uint8Array | string, options?: WriteOptions): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: normalizePath(path),
        Body: contents,
        ...(options?.contentType === undefined ? {} : { ContentType: options.contentType }),
      }),
    );
  }

  /**
   * Uploads what `contents` yields under `path` in `PART_SIZE` parts, holding at most one part in memory; a stream
   * shorter than one part is one PUT. The object appears only when the upload completes, and a failure aborts it.
   */
  override async writeStream(
    path: string,
    contents: WriteStreamSource,
    options?: WriteOptions,
  ): Promise<void> {
    const key = normalizePath(path);
    let pending: Uint8Array[] = [];
    let size = 0;
    let uploadId: string | undefined;
    const parts: { ETag: string | undefined; PartNumber: number }[] = [];
    const upload = async (body: Uint8Array) => {
      uploadId ??= (
        await this.client.send(
          new CreateMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            ...(options?.contentType === undefined ? {} : { ContentType: options.contentType }),
          }),
        )
      ).UploadId;
      const PartNumber = parts.length + 1;
      const { ETag } = await this.client.send(
        new UploadPartCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
          PartNumber,
          Body: body,
        }),
      );
      parts.push({ ETag, PartNumber });
    };
    try {
      for await (const chunk of byteChunks(contents)) {
        pending.push(chunk);
        size += chunk.byteLength;
        while (size >= PART_SIZE) {
          const joined = concatBytes(pending);
          const rest = joined.subarray(PART_SIZE);
          pending = rest.byteLength > 0 ? [rest] : [];
          size = rest.byteLength;
          await upload(joined.subarray(0, PART_SIZE));
        }
      }
      if (uploadId === undefined) return await this.write(key, concatBytes(pending), options);
      if (size > 0) await upload(concatBytes(pending));
      await this.client.send(
        new CompleteMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: { Parts: parts },
        }),
      );
    } catch (error) {
      if (uploadId !== undefined)
        await this.client
          .send(
            new AbortMultipartUploadCommand({ Bucket: this.bucket, Key: key, UploadId: uploadId }),
          )
          // The upload's own error is the one to report, never an abort failure on top of it.
          .catch(() => undefined);
      throw error;
    }
  }

  /** Removes the object under `path`; false when there was none (S3's DELETE does not say, so it asks first). */
  async delete(path: string): Promise<boolean> {
    if (!(await this.exists(path))) return false;
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: normalizePath(path) }),
    );
    return true;
  }

  /** Every key starting with `prefix`, sorted, following every page of the listing. */
  async list(prefix = ""): Promise<string[]> {
    const keys: string[] = [];
    let token: string | undefined;
    do {
      const page = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: normalizePrefix(prefix),
          ...(token === undefined ? {} : { ContinuationToken: token }),
        }),
      );
      for (const object of page.Contents ?? []) if (object.Key !== undefined) keys.push(object.Key);
      token = page.IsTruncated === true ? page.NextContinuationToken : undefined;
    } while (token !== undefined);
    return keys.sort();
  }

  /** The size, modification time and content type of the object under `path` (a HEAD request). */
  async stat(path: string): Promise<FileStat> {
    const key = normalizePath(path);
    try {
      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return {
        path: key,
        size: head.ContentLength ?? 0,
        lastModified: head.LastModified ?? null,
        contentType: head.ContentType ?? null,
      };
    } catch (error) {
      throw isNotFound(error) ? new FileNotFoundError(key) : error;
    }
  }

  /** The configured base URL (a CDN or the bucket's public domain) followed by the key. */
  url(path: string): string {
    return publicUrl(this.base, path);
  }

  /**
   * A presigned GET of `path`, valid for `expiresIn` rounded up to whole seconds.
   *
   * @throws Error when `expiresIn` is longer than seven days (the SigV4 limit).
   */
  async temporaryUrl(path: string, expiresIn: Duration): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: normalizePath(path) }),
      { expiresIn: Math.ceil(Duration.toMilliseconds(expiresIn) / 1000) },
    );
  }
}

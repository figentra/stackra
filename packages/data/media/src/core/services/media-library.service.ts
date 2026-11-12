/**
 * Stackra file contract:
 * Purpose: `MediaLibrary`, the platform service of server-side media: issues signed uploads into a bucket
 *          (`createUpload`), claims a finished upload for a bucket (`claim`), stores bytes the server made
 *          (`store`), and links a private file (`temporaryUrl`, or `temporaryUrlOf` from a stored path of a bucket).
 * Boundary: a client's bytes never pass through it (ADR 0222 decision 2); only `store` takes bytes, the server's own,
 *           under the same bucket rules a claim applies. The client puts its bytes to `uploads/<id>` on the
 *           `FileSystem` disk through a signed URL (`FileSystem.signUpload`), and the token itself carries only the id.
 *           What the server must remember about the upload (the bucket key and the expiry) it writes itself beside it,
 *           as `uploads/<id>.json`, so every disk works, an Encore bucket included, which signs no metadata (ADR 0465;
 *           before stackra-226 it was signed metadata on the old `MediaDisk`). `claim` trusts nothing the client sent
 *           but the id: it reads that record and what the store received, refuses a foreign bucket, an expired token,
 *           a missing object and a file the bucket does not take (deleting that file and its record), then moves it to
 *           `<visibility>/<bucket>/<id>.<ext>` and deletes the record. A second claim of the same token finds no
 *           record and is refused. Keeps no state of its own. The local and Electron disks cannot sign uploads, so
 *           `createUpload` refuses on them.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decisions 1 to 3); ADR 0294 (decisions 16 and 17); ADR 0263 (classes are the tokens);
 *                     ADR 0465 (one object-storage port).
 */
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";
import { FileNotFoundError } from "@stackra/filesystem";
import type { FileStat, FileSystem, WriteOptions } from "@stackra/filesystem/contracts";

import type { MediaConfig } from "#config/media.config";
import type { BucketBase } from "#core/bases/bucket-base.base";
import type { MediaType } from "#core/enums/media-type.enum";
import { UploadBucketMismatchError } from "#core/errors/upload-bucket-mismatch.error";
import { UploadExpiredError } from "#core/errors/upload-expired.error";
import { UploadIncompleteError } from "#core/errors/upload-incomplete.error";
import { UploadRejectedError } from "#core/errors/upload-rejected.error";
import { bucketKeyOf } from "#core/functions/bucket-key-of.function";
import { contentMatches } from "#core/functions/content-matches.function";
import { bucketOptionsOf } from "#core/functions/bucket-options-of.function";
import { filePathOf } from "#core/functions/file-path-of.function";
import { mintUploadId } from "#core/functions/mint-upload-id.function";
import type { BucketClass } from "#core/types/bucket-class.type";
import type { MediaFile } from "#core/types/media-file.type";
import type { PendingUpload } from "#core/types/pending-upload.type";
import { Upload } from "#core/values/upload.value";

/** Where uploads wait for their claim. */
const UPLOADS = "uploads/";

/** How many leading bytes the content check reads: enough for every signature, an `ftyp` box's brands included. */
const HEAD = 64;

/** What the server remembers about one upload, written beside it as `uploads/<id>.json`. */
type UploadRecord = { readonly bucket: string; readonly expires: string };

/** The record of a staged upload, or `null` when there is none or it does not parse. */
async function recordOf(disk: FileSystem, path: string): Promise<UploadRecord | null> {
  let text: string;
  try {
    text = new TextDecoder().decode(await disk.read(path));
  } catch (error) {
    if (error instanceof FileNotFoundError) return null;
    throw error;
  }
  try {
    const record = JSON.parse(text) as Partial<UploadRecord> | null;
    return typeof record?.bucket === "string" && typeof record.expires === "string"
      ? { bucket: record.bucket, expires: record.expires }
      : null;
  } catch {
    return null;
  }
}

/**
 * Issues and claims uploads.
 *
 * @example
 * // in an action: the client already put the file through a signed URL of the bucket
 * const file = await this.media.claim(input.image, ProductImagesBucket);
 * product.images = [...product.images, { url: file.url, alt: input.alt }];
 */
export class MediaLibrary extends Service {
  private readonly disk: FileSystem;

  private readonly config: MediaConfig;

  private readonly clock: Clock;

  /**
   * @param disk - the store: the one `FileSystem` disk `filesystem.disk` picks.
   * @param config - the upload lifetime (`uploadExpiresIn`).
   * @param clock - the time source of expiry.
   */
  constructor(disk: FileSystem, config: MediaConfig, clock: Clock) {
    super();
    this.disk = disk;
    this.config = config;
    this.clock = clock;
  }

  /**
   * A signed upload of one file into `bucket`.
   *
   * @throws UploadRejectedError when the bucket does not accept `mediaType`, or `size` is not a whole number from 1 up
   *         to the bucket's `maxBytes`.
   * @throws TypeError when `bucket` does not extend `Bucket({...})`, or the disk cannot sign uploads (local, Electron).
   */
  async createUpload<B extends BucketBase>(
    bucket: BucketClass<B>,
    request: { readonly mediaType: MediaType; readonly size: number },
  ): Promise<PendingUpload<B>> {
    const options = bucketOptionsOf(bucket);
    const key = bucketKeyOf(bucket);
    if (!options.accept.includes(request.mediaType))
      throw UploadRejectedError.create({ bucket: key, reason: "media_type" });
    if (!Number.isInteger(request.size) || request.size < 1 || request.size > options.maxBytes)
      throw UploadRejectedError.create({ bucket: key, reason: "size" });
    const id = mintUploadId();
    const lifetime = this.config.uploadExpiresIn;
    const expiresAt = new Date(this.clock.now().getTime() + Duration.toMilliseconds(lifetime));
    const target = await this.disk.signUpload(`${UPLOADS}${id}`, {
      contentType: request.mediaType,
      expiresIn: lifetime,
    });
    const record: UploadRecord = { bucket: key, expires: expiresAt.toISOString() };
    await this.disk.write(`${UPLOADS}${id}.json`, JSON.stringify(record), {
      contentType: "application/json",
    });
    return { ...target, upload: { id }, expiresAt };
  }

  /**
   * Claims a finished upload for `bucket` and returns the stored file.
   *
   * @throws UploadIncompleteError when nothing waits under the token (never uploaded, already claimed, or not a token).
   * @throws UploadBucketMismatchError when the token was signed for another bucket.
   * @throws UploadExpiredError when the token's lifetime has passed.
   * @throws UploadRejectedError when the stored file's media type or size breaks the bucket's rules, or its bytes are
   *         not that media type.
   */
  async claim<B extends BucketBase>(upload: Upload<B>, bucket: BucketClass<B>): Promise<MediaFile> {
    const options = bucketOptionsOf(bucket);
    const key = bucketKeyOf(bucket);
    if (!Upload.schema.safeParse(upload).success) throw UploadIncompleteError.create();
    const staged = `${UPLOADS}${upload.id}`;
    const recordPath = `${staged}.json`;
    const record = await recordOf(this.disk, recordPath);
    if (record === null) throw UploadIncompleteError.create();
    if (record.bucket !== key) throw UploadBucketMismatchError.create({ bucket: key });
    // An unreadable expiry is NaN, which fails the comparison: refused as expired.
    if (!(Date.parse(record.expires) >= this.clock.now().getTime()))
      throw UploadExpiredError.create();
    let object: FileStat;
    try {
      object = await this.disk.stat(staged);
    } catch (error) {
      if (error instanceof FileNotFoundError) throw UploadIncompleteError.create();
      throw error;
    }
    const mediaType = options.accept.find((type) => type === object.contentType);
    if (mediaType === undefined || object.size < 1 || object.size > options.maxBytes) {
      await this.disk.delete(staged);
      await this.disk.delete(recordPath);
      throw UploadRejectedError.create({
        bucket: key,
        reason: mediaType === undefined ? "media_type" : "size",
      });
    }
    // shortcut: reads the whole staged file (bounded by maxBytes, checked above) for its head; read a range once
    // FileSystem has one
    if (!contentMatches((await this.disk.read(staged)).subarray(0, HEAD), mediaType)) {
      await this.disk.delete(staged);
      await this.disk.delete(recordPath);
      throw UploadRejectedError.create({ bucket: key, reason: "content" });
    }
    const path = filePathOf(bucket, upload.id, mediaType);
    await this.disk.move(staged, path);
    await this.disk.delete(recordPath);
    return {
      id: upload.id,
      bucket: key,
      path,
      url: this.disk.url(path),
      mediaType,
      size: object.size,
    };
  }

  /**
   * Stores `bytes` the server made (a rendered PDF, a generated image) as a new file of `bucket`, under the rules a claim
   * applies: the bucket's media types, its size limit, and bytes that are the declared type. With `retainUntil` the file
   * is kept unchangeable until then (the disk's retention: Object Lock on `s3`).
   *
   * @throws UploadRejectedError when the bucket does not accept `mediaType`, the size is zero or above `maxBytes`, or
   *         the bytes are not that media type; nothing is written.
   * @throws TypeError when `bucket` does not extend `Bucket({...})`.
   * @throws RetentionUnsupportedError when `retainUntil` is given and the disk cannot retain a file.
   */
  async store<B extends BucketBase>(
    bucket: BucketClass<B>,
    bytes: Uint8Array,
    mediaType: MediaType,
    retention: Pick<WriteOptions, "retainUntil"> = {},
  ): Promise<MediaFile> {
    const options = bucketOptionsOf(bucket);
    const key = bucketKeyOf(bucket);
    if (!options.accept.includes(mediaType))
      throw UploadRejectedError.create({ bucket: key, reason: "media_type" });
    if (bytes.byteLength < 1 || bytes.byteLength > options.maxBytes)
      throw UploadRejectedError.create({ bucket: key, reason: "size" });
    if (!contentMatches(bytes.subarray(0, HEAD), mediaType))
      throw UploadRejectedError.create({ bucket: key, reason: "content" });
    const id = mintUploadId();
    const path = filePathOf(bucket, id, mediaType);
    await this.disk.write(path, bytes, {
      contentType: mediaType,
      ...(retention.retainUntil === undefined ? {} : { retainUntil: retention.retainUntil }),
    });
    return { id, bucket: key, path, url: this.disk.url(path), mediaType, size: bytes.byteLength };
  }

  /** A URL that reads `file` until `expiresIn` has passed; the way to show a file of a private bucket. */
  temporaryUrl(file: MediaFile, expiresIn: Duration): Promise<string> {
    return this.disk.temporaryUrl(file.path, expiresIn);
  }

  /**
   * A URL that reads the file at `path` of `bucket` until `expiresIn` has passed, for a caller that kept only the stored
   * path (an archive's) and no `MediaFile`.
   *
   * @throws TypeError when `path` is not a file of `bucket` (outside `<visibility>/<bucket>/`, or with a `..` segment),
   *         so a stored path can never sign another bucket's file.
   * @example
   * await media.temporaryUrlOf(InvoicesBucket, archive.path, Duration.minutes(5));
   */
  temporaryUrlOf(bucket: BucketClass, path: string, expiresIn: Duration): Promise<string> {
    const { visibility } = bucketOptionsOf(bucket);
    const prefix = `${visibility}/${bucketKeyOf(bucket).replaceAll(".", "/")}/`;
    if (!path.startsWith(prefix) || path.length === prefix.length || path.split("/").includes(".."))
      throw new TypeError(
        `${path} is not a file of the ${bucketKeyOf(bucket)} bucket (${prefix}…)`,
      );
    return this.disk.temporaryUrl(path, expiresIn);
  }
}

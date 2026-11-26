/**
 * Stackra file contract:
 * Purpose: `MediaLibrary`, the platform service of server-side media: issues signed uploads into a bucket
 *          (`createUpload`) and resumable tus uploads (`createResumableUpload`, started by the tus server only after
 *          `admitResumableUpload`), claims a finished upload for a bucket (`claim`), stores bytes the server made
 *          (`store`), and links a private file (`temporaryUrl`).
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
 *           `createUpload` refuses on them. A tus upload goes to the tus server (tusd), which writes it to the same
 *           `uploads/<id>` on the same disk: its record also holds the media type and size checked at creation and
 *           whether the tus server started it, `admitResumableUpload` lets the tus server start it once (its pre-create
 *           hook) and names the id and media type to store it under, and its claim takes the recorded media type
 *           (a tus server on a local disk records none), refuses as incomplete a file still short of the recorded size
 *           (kept, as a local tus directory grows it in place) and as rejected a larger one, then drops the tus
 *           server's `uploads/<id>.info` with the record.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decisions 1 to 3); ADR 0294 (decisions 16 and 17); ADR 0263 (classes are the tokens);
 *                     ADR 0465 (one object-storage port).
 */
import { Service } from "@stackra/container";
import type { Clock, PublicId } from "@stackra/contracts";
import { Duration, Enum } from "@stackra/contracts";
import { FileNotFoundError } from "@stackra/filesystem";
import type { FileStat, FileSystem, WriteOptions } from "@stackra/filesystem/contracts";

import type { MediaConfig } from "#config/media.config";
import type { BucketBase } from "#core/bases/bucket-base.base";
import { TUS_VERSION } from "#core/constants/tus-version.constant";
import { MediaType } from "#core/enums/media-type.enum";
import { UploadBucketMismatchError } from "#core/errors/upload-bucket-mismatch.error";
import { UploadExpiredError } from "#core/errors/upload-expired.error";
import { UploadIncompleteError } from "#core/errors/upload-incomplete.error";
import { UploadRejectedError } from "#core/errors/upload-rejected.error";
import { bucketKeyOf } from "#core/functions/bucket-key-of.function";
import { contentMatches } from "#core/functions/content-matches.function";
import { bucketOptionsOf } from "#core/functions/bucket-options-of.function";
import { filePathOf } from "#core/functions/file-path-of.function";
import { mintUploadId } from "#core/functions/mint-upload-id.function";
import type { AdmittedUpload } from "#core/types/admitted-upload.type";
import type { BucketClass } from "#core/types/bucket-class.type";
import type { MediaFile } from "#core/types/media-file.type";
import type { PendingUpload } from "#core/types/pending-upload.type";
import type { ResumableUpload } from "#core/types/resumable-upload.type";
import { Upload } from "#core/values/upload.value";

/** Where uploads wait for their claim. */
const UPLOADS = "uploads/";

/** How many leading bytes the content check reads: enough for every signature, an `ftyp` box's brands included. */
const HEAD = 64;

/** What the server remembers about a signed `PUT` upload, written beside it as `uploads/<id>.json`. */
type PutRecord = { readonly bucket: string; readonly expires: string };

/** What the server remembers about a tus upload: also the media type and size checked at creation, and whether the
 * tus server started it. */
type TusRecord = PutRecord & {
  readonly transfer: "tus";
  readonly mediaType: MediaType;
  readonly size: number;
  readonly started: boolean;
};

/** What the server remembers about one upload. */
type UploadRecord = PutRecord | TusRecord;

/** The media types a record may name. */
const MEDIA_TYPES: readonly string[] = Enum.values(MediaType);

/** The record of a staged upload, or `null` when there is none or it does not parse. */
async function recordOf(disk: FileSystem, path: string): Promise<UploadRecord | null> {
  let text: string;
  try {
    text = new TextDecoder().decode(await disk.read(path));
  } catch (error) {
    if (error instanceof FileNotFoundError) return null;
    throw error;
  }
  let record: Partial<Omit<TusRecord, "transfer">> & { transfer?: unknown };
  try {
    record = (JSON.parse(text) ?? {}) as typeof record;
  } catch {
    return null;
  }
  if (typeof record.bucket !== "string" || typeof record.expires !== "string") return null;
  const base: PutRecord = { bucket: record.bucket, expires: record.expires };
  if (record.transfer === undefined) return base;
  if (
    record.transfer !== "tus" ||
    typeof record.mediaType !== "string" ||
    !MEDIA_TYPES.includes(record.mediaType) ||
    typeof record.size !== "number"
  )
    return null;
  return {
    ...base,
    transfer: "tus",
    mediaType: record.mediaType,
    size: record.size,
    started: record.started === true,
  };
}

/** Whether `record` is a tus upload's. */
const isTus = (record: UploadRecord): record is TusRecord => "transfer" in record;

/** The tus `Upload-Metadata` value naming the upload: `upload <base64 id>` (the id is ASCII). */
const tusMetadataOf = (id: string): string => `upload ${btoa(id)}`;

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
    const key = this.admissibleKey(bucket, request);
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
   * A resumable tus upload of one file into `bucket`: records the bucket, the media type, the size and the expiry
   * beside `uploads/<id>`, and answers the tus server's creation URL with the headers that start the upload. Works on
   * every disk the tus server writes to (S3, R2, MinIO, GCS, a local directory): nothing is signed.
   *
   * @throws UploadRejectedError when the bucket does not accept `mediaType`, or `size` is not a whole number from 1 up
   *         to the bucket's `maxBytes`.
   * @throws TypeError when `bucket` does not extend `Bucket({...})`.
   */
  async createResumableUpload<B extends BucketBase>(
    bucket: BucketClass<B>,
    request: { readonly mediaType: MediaType; readonly size: number },
  ): Promise<ResumableUpload<B>> {
    const key = this.admissibleKey(bucket, request);
    const id = mintUploadId();
    const lifetime = this.config.uploadExpiresIn;
    const expiresAt = new Date(this.clock.now().getTime() + Duration.toMilliseconds(lifetime));
    const record: TusRecord = {
      bucket: key,
      expires: expiresAt.toISOString(),
      transfer: "tus",
      mediaType: request.mediaType,
      size: request.size,
      started: false,
    };
    await this.disk.write(`${UPLOADS}${id}.json`, JSON.stringify(record), {
      contentType: "application/json",
    });
    return {
      upload: { id },
      url: this.config.tus.endpoint,
      headers: { "tus-resumable": TUS_VERSION, "upload-metadata": tusMetadataOf(id) },
      expiresAt,
    };
  }

  /**
   * Lets the tus server start the tus upload `id` of `size` bytes (its pre-create hook asks), once: marks it started
   * and answers the id to store it under and the media type to store it with, both from the record.
   *
   * @param id - the upload id the creation request named (tus `Upload-Metadata` `upload`); anything else is refused.
   * @param size - the length the creation request declared (`Upload-Length`); `null` when it deferred it.
   * @throws UploadIncompleteError when no tus upload waits under `id` (not an upload id, never created, a signed `PUT`
   *         upload, or already claimed).
   * @throws UploadExpiredError when the upload's lifetime has passed.
   * @throws UploadRejectedError when `size` is not the size checked at creation (`size`), or the tus server already
   *         started it (`started`).
   */
  async admitResumableUpload(id: string, size: number | null): Promise<AdmittedUpload> {
    if (!Upload.schema.safeParse({ id }).success) throw UploadIncompleteError.create();
    const recordPath = `${UPLOADS}${id}.json`;
    const record = await recordOf(this.disk, recordPath);
    if (record === null || !isTus(record)) throw UploadIncompleteError.create();
    // An unreadable expiry is NaN, which fails the comparison: refused as expired.
    if (!(Date.parse(record.expires) >= this.clock.now().getTime()))
      throw UploadExpiredError.create();
    if (record.started)
      throw UploadRejectedError.create({ bucket: record.bucket, reason: "started" });
    if (size !== record.size)
      throw UploadRejectedError.create({ bucket: record.bucket, reason: "size" });
    const started: TusRecord = { ...record, started: true };
    await this.disk.write(recordPath, JSON.stringify(started), { contentType: "application/json" });
    return { id: id as PublicId<"upl">, mediaType: record.mediaType };
  }

  /**
   * Claims a finished upload for `bucket` and returns the stored file.
   *
   * @throws UploadIncompleteError when nothing waits under the token (never uploaded, already claimed, or not a token),
   *         or a tus upload holds fewer bytes than the size admitted at creation (kept: it is still arriving).
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
    // A tus server writing to a local directory grows the file in place: short of the admitted size, it is still
    // arriving, so it is kept and the claim refused as incomplete (an object store shows it only once complete).
    if (isTus(record) && object.size < record.size) throw UploadIncompleteError.create();
    // A tus upload's type is the one checked at creation: a tus server writing to a local disk records none.
    const declared = isTus(record) ? record.mediaType : object.contentType;
    const mediaType = options.accept.find((type) => type === declared);
    const sized =
      object.size >= 1 &&
      object.size <= options.maxBytes &&
      (!isTus(record) || object.size === record.size);
    if (mediaType === undefined || !sized) {
      await this.discard(staged, record, true);
      throw UploadRejectedError.create({
        bucket: key,
        reason: mediaType === undefined ? "media_type" : "size",
      });
    }
    // shortcut: reads the whole staged file (bounded by maxBytes, checked above) for its head; read a range once
    // FileSystem has one
    if (!contentMatches((await this.disk.read(staged)).subarray(0, HEAD), mediaType)) {
      await this.discard(staged, record, true);
      throw UploadRejectedError.create({ bucket: key, reason: "content" });
    }
    const path = filePathOf(bucket, upload.id, mediaType);
    await this.disk.move(staged, path);
    await this.discard(staged, record, false);
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

  /** The key of `bucket` when it takes a file of `request`'s media type and size. */
  private admissibleKey(
    bucket: BucketClass,
    request: { readonly mediaType: MediaType; readonly size: number },
  ): string {
    const options = bucketOptionsOf(bucket);
    const key = bucketKeyOf(bucket);
    if (!options.accept.includes(request.mediaType))
      throw UploadRejectedError.create({ bucket: key, reason: "media_type" });
    if (!Number.isInteger(request.size) || request.size < 1 || request.size > options.maxBytes)
      throw UploadRejectedError.create({ bucket: key, reason: "size" });
    return key;
  }

  /**
   * Deletes what the upload staged at `staged` left: the file itself when `withFile`, its record and, for a tus upload,
   * the tus server's `uploads/<id>.info`.
   */
  private async discard(staged: string, record: UploadRecord, withFile: boolean): Promise<void> {
    if (withFile) await this.disk.delete(staged);
    await this.disk.delete(`${staged}.json`);
    if (isTus(record)) await this.disk.delete(`${staged}.info`);
  }
}

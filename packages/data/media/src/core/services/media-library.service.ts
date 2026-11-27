/**
 * Stackra file contract:
 * Purpose: `MediaLibrary`, the platform service of server-side media: issues signed uploads into a bucket
 *          (`createUpload`), claims a finished upload for a bucket (`claim`), stores bytes the server made
 *          (`store`), and links a private file (`temporaryUrl`), with the malware scan gate in front of each file it
 *          places or links.
 * Boundary: a client's bytes never pass through it as a request body (ADR 0222 decision 2): `claim` reads the
 *           staged upload from the disk, bounded by the bucket's `maxBytes`; only `store` takes bytes, the server's own,
 *           under the same bucket rules a claim applies. The client puts its bytes to `uploads/<id>` on the
 *           `FileSystem` disk through a signed URL (`FileSystem.signUpload`), and the token itself carries only the id.
 *           What the server must remember about the upload (the bucket key and the expiry) it writes itself beside it,
 *           as `uploads/<id>.json`, so every disk works, an Encore bucket included, which signs no metadata (ADR 0465;
 *           before stackra-226 it was signed metadata on the old `MediaDisk`). `claim` trusts nothing the client sent
 *           but the id: it reads that record and what the store received, refuses a foreign bucket, an expired token,
 *           a missing object and a file the bucket does not take (deleting that file and its record), then writes the bytes
 *           it checked to `<visibility>/<bucket>/<id>.<ext>` and deletes the upload and its record. A second claim of the same token finds no
 *           record and is refused. Keeps no state of its own. The local and Electron disks cannot sign uploads, so
 *           `createUpload` refuses on them.
 *           The scan gate (ADR 0222: an unscanned file is never served): a file reaches a served path
 *           (`public/…`, `private/…`) only after the `FileScanner` called it `clean` where it waits under `uploads/`,
 *           which nothing serves. `infected` and `failed` delete it and refuse (`malware`, `unscannable`); `pending`
 *           (GuardDuty has not tagged it yet) keeps it and its record and raises the retryable `ScanPendingError`, so
 *           the caller claims the same upload again later; a scanner that cannot be reached throws and keeps the
 *           upload. `temporaryUrl` links a file only when its record says `clean`, and scans a record without that
 *           verdict (one made before the gate) first. A file `store` stages while the scan is pending keeps its
 *           `retainUntil` in the record, and the later claim writes it with that retention.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decisions 1 to 3; Consequences: an unscanned file is never served); ADR 0354 (the
 *                     scanner per cloud); ADR 0294 (decisions 16 and 17); ADR 0263 (classes are the tokens);
 *                     ADR 0465 (one object-storage port).
 */
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";
import { FileNotFoundError } from "@stackra/filesystem";
import type { FileStat, FileSystem, WriteOptions } from "@stackra/filesystem/contracts";

import type { MediaConfig } from "#config/media.config";
import { ScanVerdict } from "#contracts/enums/scan-verdict.enum";
import type { FileScanner } from "#contracts/ports/file-scanner.port";
import type { BucketBase } from "#core/bases/bucket-base.base";
import type { MediaType } from "#core/enums/media-type.enum";
import { FileBlockedError } from "#core/errors/file-blocked.error";
import { ScanPendingError } from "#core/errors/scan-pending.error";
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

/**
 * What the server remembers about one upload, written beside it as `uploads/<id>.json`: its bucket key, its expiry,
 * and, for bytes `store` staged while their scan was pending, the retention the claim writes them with.
 */
type UploadRecord = {
  readonly bucket: string;
  readonly expires: string;
  readonly retainUntil?: string;
};

/** The refusal reason of a scan verdict that is neither `clean` nor `pending`. */
const BLOCKED = { infected: "malware", failed: "unscannable" } as const;

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
    if (typeof record?.bucket !== "string" || typeof record.expires !== "string") return null;
    return {
      bucket: record.bucket,
      expires: record.expires,
      ...(typeof record.retainUntil === "string" ? { retainUntil: record.retainUntil } : {}),
    };
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

  private readonly scanner: FileScanner;

  /**
   * @param disk - the store: the one `FileSystem` disk `filesystem.disk` picks.
   * @param config - the upload lifetime (`uploadExpiresIn`).
   * @param clock - the time source of expiry.
   * @param scanner - the malware scanner `media.scanner` picks; every file is scanned before it is placed or linked.
   */
  constructor(disk: FileSystem, config: MediaConfig, clock: Clock, scanner: FileScanner) {
    super();
    this.disk = disk;
    this.config = config;
    this.clock = clock;
    this.scanner = scanner;
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
   * @throws UploadRejectedError when the stored file's media type or size breaks the bucket's rules, its bytes are not
   *         that media type, or the scanner found a threat (`malware`) or could not scan it (`unscannable`); the file
   *         and its record are deleted first.
   * @throws ScanPendingError when the scanner has not decided yet; the upload is kept, so the same claim succeeds
   *         later.
   * @throws Error when the scanner cannot be reached; the upload is kept.
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
    // the whole staged file (bounded by maxBytes, checked above): its head for the content check, all of it for a
    // scanner that reads the bytes
    const bytes = await this.disk.read(staged);
    // the size again on what was read: the object can be replaced through the signed URL after its stat
    const reason =
      bytes.byteLength < 1 || bytes.byteLength > options.maxBytes
        ? "size"
        : contentMatches(bytes.subarray(0, HEAD), mediaType)
          ? null
          : "content";
    if (reason !== null) {
      await this.disk.delete(staged);
      await this.disk.delete(recordPath);
      throw UploadRejectedError.create({ bucket: key, reason });
    }
    const verdict = await this.verdictOf(staged, async () => bytes);
    if (verdict === ScanVerdict.Pending) throw ScanPendingError.create({ upload: upload.id });
    if (verdict !== ScanVerdict.Clean) {
      await this.disk.delete(staged);
      await this.disk.delete(recordPath);
      throw UploadRejectedError.create({ bucket: key, reason: BLOCKED[verdict] });
    }
    // the bytes that were checked and scanned are the bytes placed: a second PUT through the still-valid signed URL
    // while the scan ran never reaches the bucket path, as a move of the staged object would let it
    const path = filePathOf(bucket, upload.id, mediaType);
    await this.disk.write(path, bytes, {
      contentType: mediaType,
      ...(record.retainUntil === undefined ? {} : { retainUntil: new Date(record.retainUntil) }),
    });
    await this.disk.delete(staged);
    await this.disk.delete(recordPath);
    return {
      id: upload.id,
      bucket: key,
      path,
      url: this.disk.url(path),
      mediaType,
      size: bytes.byteLength,
      scan: ScanVerdict.Clean,
    };
  }

  /**
   * Stores `bytes` the server made (a rendered PDF, a generated image) as a new file of `bucket`, under the rules a claim
   * applies: the bucket's media types, its size limit, bytes that are the declared type, and a clean malware scan. The
   * bytes wait under `uploads/<id>` while the scanner looks at them, and reach the bucket's path only when clean. With
   * `retainUntil` the file is kept unchangeable until then (the disk's retention: Object Lock on `s3`).
   *
   * @throws UploadRejectedError when the bucket does not accept `mediaType`, the size is zero or above `maxBytes`, the
   *         bytes are not that media type, or the scanner found a threat (`malware`) or could not scan them
   *         (`unscannable`); nothing is kept.
   * @throws ScanPendingError when the scanner has not decided yet (GuardDuty): the bytes stay staged as an upload into
   *         `bucket`, with the retention, and `claim({ id: error.upload }, bucket)` finishes the store later.
   * @throws Error when the scanner cannot be reached; nothing is kept.
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
    const staged = `${UPLOADS}${id}`;
    await this.disk.write(staged, bytes, { contentType: mediaType });
    let verdict: ScanVerdict;
    try {
      verdict = await this.verdictOf(staged, async () => bytes);
    } catch (error) {
      await this.disk.delete(staged);
      throw error;
    }
    if (verdict === ScanVerdict.Pending) {
      const expiresAt = new Date(
        this.clock.now().getTime() + Duration.toMilliseconds(this.config.uploadExpiresIn),
      );
      const record: UploadRecord = {
        bucket: key,
        expires: expiresAt.toISOString(),
        ...(retention.retainUntil === undefined
          ? {}
          : { retainUntil: retention.retainUntil.toISOString() }),
      };
      await this.disk.write(`${staged}.json`, JSON.stringify(record), {
        contentType: "application/json",
      });
      throw ScanPendingError.create({ upload: id });
    }
    if (verdict !== ScanVerdict.Clean) {
      await this.disk.delete(staged);
      throw UploadRejectedError.create({ bucket: key, reason: BLOCKED[verdict] });
    }
    const path = filePathOf(bucket, id, mediaType);
    await this.disk.write(path, bytes, {
      contentType: mediaType,
      ...(retention.retainUntil === undefined ? {} : { retainUntil: retention.retainUntil }),
    });
    await this.disk.delete(staged);
    return {
      id,
      bucket: key,
      path,
      url: this.disk.url(path),
      mediaType,
      size: bytes.byteLength,
      scan: ScanVerdict.Clean,
    };
  }

  /**
   * A URL that reads `file` until `expiresIn` has passed; the way to show a file of a private bucket. Only a clean file
   * is linked: a record without a `clean` verdict (one made before the scan gate) is scanned first.
   *
   * @throws ScanPendingError when the scanner has not decided yet; link it again later.
   * @throws FileBlockedError when the scanner found a threat (`malware`) or could not scan the file (`unscannable`).
   * @throws Error when the scanner cannot be reached.
   */
  async temporaryUrl(
    file: Pick<MediaFile, "id" | "path"> & { readonly scan?: ScanVerdict },
    expiresIn: Duration,
  ): Promise<string> {
    if (file.scan !== ScanVerdict.Clean) {
      const verdict = await this.verdictOf(file.path, () => this.disk.read(file.path));
      if (verdict === ScanVerdict.Pending) throw ScanPendingError.create({ upload: file.id });
      if (verdict !== ScanVerdict.Clean)
        throw FileBlockedError.create({ reason: BLOCKED[verdict] });
    }
    return this.disk.temporaryUrl(file.path, expiresIn);
  }

  /** The scanner's verdict on the object at `path`, whose bytes `read` gives. */
  private async verdictOf(path: string, read: () => Promise<Uint8Array>): Promise<ScanVerdict> {
    return (await this.scanner.scan(path, read)).verdict;
  }
}

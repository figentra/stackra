/**
 * Stackra file contract:
 * Purpose: `MediaLibrary`, the platform service of server-side media: issues signed uploads into a bucket
 *          (`createUpload`), claims a finished upload for a bucket (`claim`), and links a private file
 *          (`temporaryUrl`).
 * Boundary: the bytes never pass through it (ADR 0222 decision 2): the client puts them to `uploads/<id>` on the
 *           `MediaDisk` through a signed URL that binds the media type, the bucket key and the expiry as signed
 *           metadata, so the token itself carries only the id. `claim` trusts nothing the client sent but the id: it
 *           reads what the store received, refuses a foreign bucket, an expired token, a missing object and a file
 *           the bucket does not take (deleting that file), then moves it to `<visibility>/<bucket>/<id>.<ext>`. A
 *           second claim of the same token finds nothing and is refused. Keeps no state of its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decisions 1 to 3); ADR 0294 (decisions 16 and 17); ADR 0263 (classes are the tokens).
 */
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";

import type { MediaConfig } from "#config/media.config";
import type { MediaDisk } from "#contracts/ports/media-disk.port";
import type { BucketBase } from "#core/bases/bucket-base.base";
import type { MediaType } from "#core/enums/media-type.enum";
import { UploadBucketMismatchError } from "#core/errors/upload-bucket-mismatch.error";
import { UploadExpiredError } from "#core/errors/upload-expired.error";
import { UploadIncompleteError } from "#core/errors/upload-incomplete.error";
import { UploadRejectedError } from "#core/errors/upload-rejected.error";
import { bucketKeyOf } from "#core/functions/bucket-key-of.function";
import { bucketOptionsOf } from "#core/functions/bucket-options-of.function";
import { filePathOf } from "#core/functions/file-path-of.function";
import { mintUploadId } from "#core/functions/mint-upload-id.function";
import type { BucketClass } from "#core/types/bucket-class.type";
import type { MediaFile } from "#core/types/media-file.type";
import type { PendingUpload } from "#core/types/pending-upload.type";
import { Upload } from "#core/values/upload.value";

/** Where uploads wait for their claim. */
const UPLOADS = "uploads/";

/**
 * Issues and claims uploads.
 *
 * @example
 * // in an action: the client already put the file through a signed URL of the bucket
 * const file = await this.media.claim(input.image, ProductImagesBucket);
 * product.images = [...product.images, { url: file.url, alt: input.alt }];
 */
export class MediaLibrary extends Service {
  private readonly disk: MediaDisk;

  private readonly config: MediaConfig;

  private readonly clock: Clock;

  /**
   * @param disk - the media store.
   * @param config - the upload lifetime (`uploadExpiresIn`).
   * @param clock - the time source of expiry.
   */
  constructor(disk: MediaDisk, config: MediaConfig, clock: Clock) {
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
   * @throws TypeError when `bucket` does not extend `Bucket({...})`.
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
      metadata: { bucket: key, expires: expiresAt.toISOString() },
      expiresIn: lifetime,
    });
    return { ...target, upload: { id }, expiresAt };
  }

  /**
   * Claims a finished upload for `bucket` and returns the stored file.
   *
   * @throws UploadIncompleteError when nothing waits under the token (never uploaded, already claimed, or not a token).
   * @throws UploadBucketMismatchError when the token was signed for another bucket.
   * @throws UploadExpiredError when the token's lifetime has passed.
   * @throws UploadRejectedError when the stored file's media type or size breaks the bucket's rules.
   */
  async claim<B extends BucketBase>(upload: Upload<B>, bucket: BucketClass<B>): Promise<MediaFile> {
    const options = bucketOptionsOf(bucket);
    const key = bucketKeyOf(bucket);
    if (!Upload.schema.safeParse(upload).success) throw UploadIncompleteError.create();
    const staged = `${UPLOADS}${upload.id}`;
    const object = await this.disk.stat(staged);
    if (object === null) throw UploadIncompleteError.create();
    if (object.metadata["bucket"] !== key) throw UploadBucketMismatchError.create({ bucket: key });
    // A missing or unreadable expiry is NaN, which fails the comparison: refused as expired.
    if (!(Date.parse(object.metadata["expires"] ?? "") >= this.clock.now().getTime()))
      throw UploadExpiredError.create();
    const mediaType = options.accept.find((type) => type === object.contentType);
    if (mediaType === undefined || object.size < 1 || object.size > options.maxBytes) {
      await this.disk.delete(staged);
      throw UploadRejectedError.create({
        bucket: key,
        reason: mediaType === undefined ? "media_type" : "size",
      });
    }
    const path = filePathOf(bucket, upload.id, mediaType);
    await this.disk.move(staged, path);
    return {
      id: upload.id,
      bucket: key,
      path,
      url: this.disk.url(path),
      mediaType,
      size: object.size,
    };
  }

  /** A URL that reads `file` until `expiresIn` has passed; the way to show a file of a private bucket. */
  temporaryUrl(file: MediaFile, expiresIn: Duration): Promise<string> {
    return this.disk.temporaryUrl(file.path, expiresIn);
  }
}

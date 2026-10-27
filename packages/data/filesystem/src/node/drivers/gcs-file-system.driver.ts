/**
 * Stackra file contract:
 * Purpose: the Google Cloud Storage `FileSystem` (`disk: "gcs"`), for the in-country GCP environments (Dammam for
 *          KSA). Temporary URLs are V4 signed GETs.
 * Boundary: holds no credential: the client reads Application Default Credentials (workload identity on GKE or Cloud
 *           Run, `GOOGLE_APPLICATION_CREDENTIALS` locally), and signing a URL uses the bound service account's
 *           `signBlob` when no key file is present. Every key passes `normalizePath`. A missing object is a
 *           `FileNotFoundError`; any other store error is rethrown as it is. Which environment runs this disk is
 *           runway's `filesystem.disk` value, never code. `readStream` checks the object exists, then streams
 *           the download, so a missing object rejects before the stream.
 * Runtime: node
 * Governing contract: ADR 0354 (two clouds: a driver for both where object storage differs); ADR 0222 (decision 1);
 *                     ADR 0234 (decision 7); ADR 0173 (secrets); ADR 0294 (decision 16);
 *                     ADR 0413 (streamed reads, STA-1259).
 */
import { Readable } from "node:stream";

import { Storage } from "@google-cloud/storage";
import type { Bucket } from "@google-cloud/storage";
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import { FilesystemConfig } from "#config/filesystem.config";
import { FileSystem } from "#contracts/ports/file-system.port";
import type { FileStat } from "#contracts/types/file-stat.type";
import type { WriteOptions } from "#contracts/types/write-options.type";
import { FileNotFoundError } from "#core/errors/file-not-found.error";
import { normalizePath } from "#core/functions/normalize-path.function";
import { normalizePrefix } from "#core/functions/normalize-prefix.function";
import { publicUrl } from "#core/functions/public-url.function";

/** The longest a V4 signed URL may live: seven days. */
const MAX_SIGNED_MS = 7 * 24 * 60 * 60 * 1000;

/** Whether a store error means the object is not there (the JSON API's 404). */
function isNotFound(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === 404;
}

/**
 * Keeps files in a Google Cloud Storage bucket.
 *
 * @example
 * // runway.yaml (ksa production): config.filesystem: { disk: gcs, gcs: { bucket: acme-files-sa } }
 * const link = await files.temporaryUrl("exports/orders.csv", Duration.minutes(10));
 */
export class GcsFileSystemDriver extends Driver(FileSystem) {
  /** The client every call goes through. */
  readonly client: Storage;

  private readonly bucket: Bucket;

  private readonly base: string | null;

  /**
   * @param config - the bucket and project (`gcs`) and the public base URL (`url`).
   * @throws TypeError when `gcs.bucket` is empty.
   */
  constructor(config: FilesystemConfig) {
    super();
    const { bucket, projectId } = config.gcs;
    if (bucket === "")
      throw new TypeError("The gcs disk needs a bucket: set `filesystem.gcs.bucket`");
    this.base = config.url;
    this.client = new Storage(projectId === null ? {} : { projectId });
    this.bucket = this.client.bucket(bucket);
  }

  /** Whether an object is stored under `path`. */
  async exists(path: string): Promise<boolean> {
    const [found] = await this.bucket.file(normalizePath(path)).exists();
    return found;
  }

  /** The bytes of the object under `path`. */
  async read(path: string): Promise<Uint8Array> {
    const key = normalizePath(path);
    try {
      const [contents] = await this.bucket.file(key).download();
      return new Uint8Array(contents);
    } catch (error) {
      throw isNotFound(error) ? new FileNotFoundError(key) : error;
    }
  }

  /**
   * The object under `path` as a streamed download.
   *
   * shortcut: an object deleted between the check and the first byte errors the stream with the store's 404, not a
   * `FileNotFoundError`; peek the first chunk before returning if a caller ever needs that distinction.
   */
  override async readStream(path: string): Promise<ReadableStream<Uint8Array>> {
    const key = normalizePath(path);
    const file = this.bucket.file(key);
    const [found] = await file.exists();
    if (!found) throw new FileNotFoundError(key);
    return Readable.toWeb(file.createReadStream()) as unknown as ReadableStream<Uint8Array>;
  }

  /** Uploads `contents` under `path` in one request; GCS replaces an object atomically. */
  async write(path: string, contents: Uint8Array | string, options?: WriteOptions): Promise<void> {
    await this.bucket
      .file(normalizePath(path))
      .save(typeof contents === "string" ? contents : Buffer.from(contents), {
        resumable: false,
        ...(options?.contentType === undefined ? {} : { contentType: options.contentType }),
      });
  }

  /** Removes the object under `path`; false when there was none (the 404 of the delete says so). */
  async delete(path: string): Promise<boolean> {
    try {
      await this.bucket.file(normalizePath(path)).delete();
      return true;
    } catch (error) {
      if (isNotFound(error)) return false;
      throw error;
    }
  }

  /** Every key starting with `prefix`, sorted; the client follows every page of the listing. */
  async list(prefix = ""): Promise<string[]> {
    const [files] = await this.bucket.getFiles({
      prefix: normalizePrefix(prefix),
      autoPaginate: true,
    });
    return files.map((file) => file.name).sort();
  }

  /** The size, update time and content type of the object under `path`. */
  async stat(path: string): Promise<FileStat> {
    const key = normalizePath(path);
    try {
      const [metadata] = await this.bucket.file(key).getMetadata();
      return {
        path: key,
        size: Number(metadata.size ?? 0),
        lastModified: metadata.updated === undefined ? null : new Date(metadata.updated),
        contentType: metadata.contentType ?? null,
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
   * A V4 signed GET of `path`, valid for `expiresIn`.
   *
   * @throws RangeError when `expiresIn` is longer than seven days (the V4 limit).
   */
  async temporaryUrl(path: string, expiresIn: Duration): Promise<string> {
    const ms = Duration.toMilliseconds(expiresIn);
    if (ms > MAX_SIGNED_MS) throw new RangeError("A GCS signed URL lives at most seven days");
    const [link] = await this.bucket.file(normalizePath(path)).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + ms,
    });
    return link;
  }
}

/**
 * Stackra file contract:
 * Purpose: the Encore bucket `FileSystem` (`disk: "encore_bucket"`): files in the Encore object-storage bucket the
 *          generated Encore app declares, reached through the `EncoreBucket` port.
 * Boundary: imports no `encore.dev` (ADR 0124): the generated app binds `EncoreBucket`. Every key passes
 *           `normalizePath`. `read`, `stat` and `delete` ask `exists` first, because Encore's not-found error class
 *           lives in `encore.dev`. An Encore bucket reports no modification time, so `lastModified` is `null`.
 * Runtime: node
 * Governing contract: ADR 0091 and 0124 (Encore is generated); ADR 0234 (decision 7); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import { EncoreBucket } from "#contracts/ports/encore-bucket.port";
import { FileSystem } from "#contracts/ports/file-system.port";
import type { FileStat } from "#contracts/types/file-stat.type";
import type { WriteOptions } from "#contracts/types/write-options.type";
import { FileNotFoundError } from "#core/errors/file-not-found.error";
import { normalizePath } from "#core/functions/normalize-path.function";
import { normalizePrefix } from "#core/functions/normalize-prefix.function";

/**
 * Keeps files in an Encore bucket.
 *
 * @example
 * // runway.yaml: config.filesystem.disk: encore_bucket
 * await files.write("exports/orders.csv", csv, { contentType: "text/csv" });
 */
export class EncoreBucketFileSystemDriver extends Driver(FileSystem) {
  private readonly bucket: EncoreBucket;

  /** @param bucket - the Encore bucket, bound by the generated Encore app. */
  constructor(bucket: EncoreBucket) {
    super();
    this.bucket = bucket;
  }

  /** Whether an object is stored under `path`. */
  async exists(path: string): Promise<boolean> {
    return this.bucket.exists(normalizePath(path));
  }

  /** The bytes of the object under `path`. */
  async read(path: string): Promise<Uint8Array> {
    return new Uint8Array(await this.bucket.download(await this.existing(path)));
  }

  /** Uploads `contents` under `path`, with its content type when given. */
  async write(path: string, contents: Uint8Array | string, options?: WriteOptions): Promise<void> {
    await this.bucket.upload(
      normalizePath(path),
      typeof contents === "string" ? new TextEncoder().encode(contents) : contents,
      options?.contentType === undefined ? undefined : { contentType: options.contentType },
    );
  }

  /** Removes the object under `path`; false when there was none. */
  async delete(path: string): Promise<boolean> {
    const key = normalizePath(path);
    if (!(await this.bucket.exists(key))) return false;
    await this.bucket.remove(key);
    return true;
  }

  /** Every object name starting with `prefix`, sorted. */
  async list(prefix = ""): Promise<string[]> {
    const wanted = normalizePrefix(prefix);
    const names: string[] = [];
    for await (const entry of this.bucket.list(wanted === "" ? {} : { prefix: wanted }))
      names.push(entry.name);
    return names.sort();
  }

  /** The size and content type of the object under `path`; no modification time. */
  async stat(path: string): Promise<FileStat> {
    const key = await this.existing(path);
    const attrs = await this.bucket.attrs(key);
    return {
      path: key,
      size: attrs.size,
      lastModified: null,
      contentType: attrs.contentType ?? null,
    };
  }

  /** The bucket's public URL of the key; Encore refuses when the bucket is not public. */
  url(path: string): string {
    return this.bucket.publicUrl(normalizePath(path));
  }

  /** A signed download URL of `path`, valid for `expiresIn` rounded up to whole seconds. */
  async temporaryUrl(path: string, expiresIn: Duration): Promise<string> {
    const ttl = Math.ceil(Duration.toMilliseconds(expiresIn) / 1000);
    return (await this.bucket.signedDownloadUrl(normalizePath(path), { ttl })).url;
  }

  /**
   * The normalised key of `path`, when an object is stored there.
   *
   * @throws FileNotFoundError when none is.
   */
  private async existing(path: string): Promise<string> {
    const key = normalizePath(path);
    if (!(await this.bucket.exists(key))) throw new FileNotFoundError(key);
    return key;
  }
}

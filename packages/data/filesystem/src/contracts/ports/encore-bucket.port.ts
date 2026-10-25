/**
 * Stackra file contract:
 * Purpose: the `EncoreBucket` port: the slice of an Encore object-storage `Bucket` the `encore_bucket` disk uses, so
 *          this package drives an Encore bucket without importing `encore.dev`.
 * Boundary: an abstract class that is its own token, keyed `filesystem.EncoreBucket`. The generated Encore app
 *           (`.stackra/encore`, ADR 0091 and 0124) declares the bucket and binds a driver that forwards each call to
 *           it (`upload` takes `Buffer.from(data)` there). The method names and shapes are Encore's.
 * Runtime: isomorphic
 * Governing contract: ADR 0124 (no hand-written Encore in a member); ADR 0260 (a package that needs a runtime defines
 *                     a port); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

/**
 * An Encore bucket, as the `encore_bucket` disk sees it.
 *
 * @example
 * // generated in .stackra/encore
 * export class FilesBucketDriver extends Driver(EncoreBucket) {
 *   upload(name: string, data: Uint8Array, options?: { contentType?: string }) {
 *     return files.upload(name, Buffer.from(data), options);
 *   }
 *   // ...
 * }
 */
export abstract class EncoreBucket extends Port {
  /** Type-only port key, so `DriverName<EncoreBucket>` narrows to this port's drivers. */
  declare readonly "~key": "filesystem.EncoreBucket";

  /** Stores `data` under `name`, replacing what was there. */
  abstract upload(
    name: string,
    data: Uint8Array,
    options?: { readonly contentType?: string },
  ): Promise<unknown>;

  /**
   * The bytes under `name`.
   *
   * @throws Error when nothing is stored there.
   */
  abstract download(name: string): Promise<Uint8Array>;

  /** Whether an object is stored under `name`. */
  abstract exists(name: string): Promise<boolean>;

  /** Removes the object under `name`. */
  abstract remove(name: string): Promise<void>;

  /** Every object whose name starts with `prefix`. */
  abstract list(query: {
    readonly prefix?: string;
  }): AsyncIterable<{ readonly name: string; readonly size: number }>;

  /**
   * The size and content type of the object under `name`.
   *
   * @throws Error when nothing is stored there.
   */
  abstract attrs(name: string): Promise<{ readonly size: number; readonly contentType?: string }>;

  /**
   * The public URL of `name`.
   *
   * @throws Error when the bucket is not public.
   */
  abstract publicUrl(name: string): string;

  /** A URL that reads `name` for `ttl` seconds. */
  abstract signedDownloadUrl(
    name: string,
    options: { readonly ttl: number },
  ): Promise<{ readonly url: string }>;
}

/**
 * Stackra file contract:
 * Purpose: `StorageAreaHandle`, one named area of the `Storage` port (`storage.prefs`, `usePrefs()`): JSON values by key,
 *          and shape classes read and written through their generated schemas.
 * Boundary: a type only. Reads and writes are synchronous against the area's memory copy; a driver persists each write
 *           in the background, and `Storage.flush()` waits for it. A value is kept as JSON, so what comes back is the
 *           wire form (a `Date` comes back as its ISO string through `get`, and as a `Date` through `read` when the
 *           schema decodes it). A shape class's key is the one gen registered for it.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decisions 2 and 4), ADR 0294 (decisions 20 and 26).
 */
import type { AnyClass } from "@stackra/container";
import type { Json } from "@stackra/contracts";

import type { StorageWriteOptions } from "#contracts/types/storage-write-options.type";

/**
 * One storage area.
 *
 * @example
 * const prefs = usePrefs();
 * prefs.write(DevicePrefs, values); // under `console.device_prefs`
 * const device = prefs.read(DevicePrefs); // the stored prefs, or the shape's defaults
 */
export interface StorageAreaHandle {
  /** The value under `key` as JSON, or `undefined` when absent or expired. */
  get(key: string): Json | undefined;

  /**
   * Stores `value` under `key` as JSON.
   *
   * @throws TypeError when `value` has no JSON form (`undefined`, a function).
   * @throws RangeError when `options.ttl` is not a duration.
   */
  set(key: string, value: unknown, options?: StorageWriteOptions): void;

  /** Whether a live value is stored under `key`. */
  has(key: string): boolean;

  /** Removes the value under `key`; nothing happens when there is none. */
  delete(key: string): void;

  /** The keys of every live value, in insertion order. */
  keys(): string[];

  /** Removes every value of the area. */
  clear(): void;

  /**
   * The stored value of a shape class, decoded and with its defaults applied; the shape's defaults when nothing is
   * stored or what is stored no longer fits the shape.
   *
   * @throws TypeError when gen registered no key or no schema for `type`.
   * @throws ZodError when nothing fits and the shape has a field without a default.
   */
  read<T extends object>(type: AnyClass<T>): T;

  /**
   * Checks `value` against the schema of `type` and stores it under the key gen registered for `type`.
   *
   * @throws TypeError when gen registered no key or no schema for `type`.
   * @throws ZodError when `value` does not fit the shape; nothing is stored then.
   */
  write<T extends object>(type: AnyClass<T>, value: T, options?: StorageWriteOptions): void;
}

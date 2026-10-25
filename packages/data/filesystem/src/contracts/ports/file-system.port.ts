/**
 * Stackra file contract:
 * Purpose: the `FileSystem` port: one disk of files addressed by relative keys (`invoices/2026/inv_01.pdf`). Code that
 *          stores or serves files injects it; config `filesystem.disk` picks the driver (`memory`, `local`, `s3`,
 *          `gcs`, `encore_bucket`, `electron`).
 * Boundary: an abstract class that is its own token, keyed `filesystem.FileSystem`. A key is relative, `/`-separated,
 *           with no `..` segment; every driver refuses one that is not. Runtime tenant files and their key layout are
 *           the files service's (ADR 0222); a disk only stores bytes. A leaf file: it imports nothing outside
 *           `src/contracts` but the `Port` base and `Duration`.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 7: the only storage API, disks injected); ADR 0222 (decision 1: drivers);
 *                     ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type).
 */
import { type Duration, Port } from "@stackra/contracts";

import type { FileStat } from "#contracts/types/file-stat.type";
import type { WriteOptions } from "#contracts/types/write-options.type";

/**
 * One disk of files.
 *
 * @example
 * constructor(files: FileSystem) { ... }
 *
 * await this.files.write("exports/orders.csv", csv, { contentType: "text/csv" });
 * const link = await this.files.temporaryUrl("exports/orders.csv", Duration.minutes(10));
 */
export abstract class FileSystem extends Port {
  /** Type-only port key, so `DriverName<FileSystem>` narrows to this port's drivers. */
  declare readonly "~key": "filesystem.FileSystem";

  /**
   * Whether a file is stored under `path`.
   *
   * @throws RangeError when `path` is not a key inside the disk.
   */
  abstract exists(path: string): Promise<boolean>;

  /**
   * The bytes stored under `path`, as a new array the caller owns.
   *
   * @throws FileNotFoundError (from `@stackra/filesystem`) when nothing is stored there.
   * @throws RangeError when `path` is not a key inside the disk.
   */
  abstract read(path: string): Promise<Uint8Array>;

  /**
   * Stores `contents` under `path`, replacing what was there; a string is written as UTF-8. A driver never leaves a
   * partly written file behind.
   *
   * @throws RangeError when `path` is not a key inside the disk.
   */
  abstract write(
    path: string,
    contents: Uint8Array | string,
    options?: WriteOptions,
  ): Promise<void>;

  /**
   * Removes the file under `path`.
   *
   * @returns true when a file was removed; false when there was none.
   * @throws RangeError when `path` is not a key inside the disk.
   */
  abstract delete(path: string): Promise<boolean>;

  /**
   * Every key that starts with `prefix`, at any depth, sorted. A prefix ending in `/` is a folder; the empty prefix
   * lists the whole disk.
   *
   * @throws RangeError when `prefix` reaches outside the disk.
   */
  abstract list(prefix?: string): Promise<string[]>;

  /**
   * The size, time and type of the file under `path`.
   *
   * @throws FileNotFoundError (from `@stackra/filesystem`) when nothing is stored there.
   * @throws RangeError when `path` is not a key inside the disk.
   */
  abstract stat(path: string): Promise<FileStat>;

  /**
   * The public URL of `path`, for a file on a public disk. It does not check that the file exists.
   *
   * @throws Error when the disk has no public URL (`filesystem.url` is not set).
   */
  abstract url(path: string): string;

  /**
   * A URL that reads `path` until `expiresIn` has passed, for a file on a private disk.
   *
   * @throws Error when the driver cannot sign URLs (the local disk).
   */
  abstract temporaryUrl(path: string, expiresIn: Duration): Promise<string>;
}

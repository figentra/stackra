/**
 * Stackra file contract:
 * Purpose: the `FileSystem` port: one disk of files addressed by relative keys (`invoices/2026/inv_01.pdf`). Code that
 *          stores or serves files injects it; config `filesystem.disk` picks the driver (`memory`, `local`, `s3`,
 *          `gcs`, `encore_bucket`, `electron`, `expo`).
 * Boundary: an abstract class that is its own token, keyed `filesystem.FileSystem`. A key is relative, `/`-separated,
 *           with no `..` segment; every driver refuses one that is not. Runtime tenant files and their key layout are
 *           the files service's (ADR 0222); a disk only stores bytes. A leaf file: it imports nothing outside
 *           `src/contracts` but the `Port` base and `Duration`. `writeStream`, `readStream`, `move` and `signUpload`
 *           are the implemented members: `writeStream` buffers the stream and calls `write` (the S3 driver overrides it
 *           with a multipart upload); `readStream` reads the whole file with `read` and serves it as one chunk (the
 *           local, Electron, S3 and GCS drivers override it to stream from the store); `move` reads, writes and
 *           deletes (the memory, local, S3 and GCS drivers override it with the store's own move); `signUpload`
 *           refuses (the memory, S3, GCS and Encore bucket drivers sign; the local and Electron disks cannot). The
 *           last two came from @stackra/media's `MediaDisk`, folded in here (stackra-226), so media runs on every disk.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 7: the only storage API, disks injected); ADR 0222 (decision 1: drivers);
 *                     ADR 0413 (streamed writes; streamed reads follow the same shape, STA-1259);
 *                     ADR 0222 (decision 2: presigned uploads); ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports
 *                     resolve by type); ADR 0465 (one object-storage port).
 */
import { type Duration, Port } from "@stackra/contracts";

import { byteChunks } from "#contracts/functions/byte-chunks.function";
import { concatBytes } from "#contracts/functions/concat-bytes.function";
import type { FileStat } from "#contracts/types/file-stat.type";
import type { SignedUpload } from "#contracts/types/signed-upload.type";
import type { UploadRequest } from "#contracts/types/upload-request.type";
import type { WriteOptions } from "#contracts/types/write-options.type";
import type { WriteStreamSource } from "#contracts/types/write-stream-source.type";

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
   * The bytes stored under `path` as a web `ReadableStream`, so a large file (an import, an archive) is read chunk by
   * chunk instead of whole. The promise settles once the file is found, so a missing file rejects here, never inside
   * the stream; a store failure after that errors the stream. This default calls `read` and serves the bytes as one
   * chunk; a disk that can stream overrides it (local, Electron, S3, GCS).
   *
   * @throws FileNotFoundError (from `@stackra/filesystem`) when nothing is stored there.
   * @throws RangeError when `path` is not a key inside the disk.
   * @example
   * const body = await this.files.readStream("imports/orders.csv");
   * return new Response(body, { headers: { "content-type": "text/csv" } });
   */
  async readStream(path: string): Promise<ReadableStream<Uint8Array>> {
    const bytes = await this.read(path);
    return new ReadableStream<Uint8Array>({
      start(controller) {
        if (bytes.byteLength > 0) controller.enqueue(bytes);
        controller.close();
      },
    });
  }

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
   * Stores what `contents` yields under `path`, replacing what was there; string chunks are written as UTF-8. Like
   * `write`, it never leaves a partly written file behind: a stream that fails stores nothing. This default reads the
   * whole stream into memory and calls `write`; a bucket disk that can upload in parts overrides it (S3 and R2).
   *
   * @throws RangeError when `path` is not a key inside the disk.
   * @throws the stream's own error when it fails.
   * @example
   * await this.files.writeStream("exports/orders.csv", csvRows(orders), { contentType: "text/csv" });
   */
  async writeStream(
    path: string,
    contents: WriteStreamSource,
    options?: WriteOptions,
  ): Promise<void> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of byteChunks(contents)) chunks.push(chunk);
    await this.write(path, concatBytes(chunks), options);
  }

  /**
   * Removes the file under `path`.
   *
   * @returns true when a file was removed; false when there was none.
   * @throws RangeError when `path` is not a key inside the disk.
   */
  abstract delete(path: string): Promise<boolean>;

  /**
   * Moves the file under `from` to `to`, keeping its media type, replacing what was at `to`. This default reads the
   * file, writes it under `to` and deletes `from`, so it holds the file in memory once and drops any store metadata
   * but the media type; a disk with its own move overrides it (memory, local, S3, GCS).
   *
   * @throws FileNotFoundError (from `@stackra/filesystem`) when nothing is stored under `from`.
   * @throws RangeError when `from` or `to` is not a key inside the disk.
   * @example
   * await this.files.move("uploads/upl_01…", "public/products/upl_01….png");
   */
  async move(from: string, to: string): Promise<void> {
    const { contentType } = await this.stat(from);
    await this.write(to, await this.read(from), contentType === null ? {} : { contentType });
    await this.delete(from);
  }

  /**
   * A URL that accepts one `PUT` of a file under `path` on the request's terms until it expires, so a client uploads
   * straight to the store and the bytes never pass through a service (ADR 0222 decision 2). This default refuses: a
   * disk that can sign overrides it (memory, S3 and R2, GCS, Encore bucket).
   *
   * @throws TypeError when the disk cannot sign uploads (the local and Electron disks).
   * @throws RangeError when `path` is not a key inside the disk.
   * @example
   * const target = await this.files.signUpload("uploads/upl_01…", {
   *   contentType: "image/png",
   *   expiresIn: Duration.hours(1),
   * });
   */
  async signUpload(_path: string, _request: UploadRequest): Promise<SignedUpload> {
    throw new TypeError(
      "This disk cannot sign uploads: use the memory, s3, gcs or encore_bucket disk for direct uploads",
    );
  }

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

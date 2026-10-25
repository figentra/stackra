/**
 * Stackra file contract:
 * Purpose: the in-memory `FileSystem` for tests and `disk: "memory"`: the same key, list, stat and URL contract as
 *          the real disks, held in a `Map` for the life of the container.
 * Boundary: the memory driver every capability ships first (ADR 0266); isomorphic, so it ships from `.`. It keeps
 *           copies, so a caller that changes its array afterwards does not change the stored file. `temporaryUrl` is
 *           the public URL with an `expires` parameter and no signature: nothing guards a memory disk.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 7); ADR 0266 (memory drivers first); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";

import { FilesystemConfig } from "#config/filesystem.config";
import { FileSystem } from "#contracts/ports/file-system.port";
import type { FileStat } from "#contracts/types/file-stat.type";
import type { WriteOptions } from "#contracts/types/write-options.type";
import { FileNotFoundError } from "#core/errors/file-not-found.error";
import { normalizePath } from "#core/functions/normalize-path.function";
import { normalizePrefix } from "#core/functions/normalize-prefix.function";
import { publicUrl } from "#core/functions/public-url.function";

/** One stored file. */
type StoredFile = {
  readonly bytes: Uint8Array;
  readonly contentType: string | null;
  readonly lastModified: Date;
};

/**
 * Holds files in memory.
 *
 * @example
 * const files = new MemoryFileSystemDriver(buildConfig(FilesystemConfig), clock);
 * await files.write("a/b.txt", "hello");
 */
export class MemoryFileSystemDriver extends Driver(FileSystem) {
  private readonly files = new Map<string, StoredFile>();

  private readonly config: FilesystemConfig;

  private readonly clock: Clock;

  /**
   * @param config - the public base URL (`url`).
   * @param clock - the time source of `lastModified`.
   */
  constructor(config: FilesystemConfig, clock: Clock) {
    super();
    this.config = config;
    this.clock = clock;
  }

  /** Whether a file is stored under `path`. */
  async exists(path: string): Promise<boolean> {
    return this.files.has(normalizePath(path));
  }

  /** A copy of the bytes under `path`. */
  async read(path: string): Promise<Uint8Array> {
    return this.find(normalizePath(path)).bytes.slice();
  }

  /** Stores a copy of `contents` under `path`. */
  async write(path: string, contents: Uint8Array | string, options?: WriteOptions): Promise<void> {
    this.files.set(normalizePath(path), {
      bytes: typeof contents === "string" ? new TextEncoder().encode(contents) : contents.slice(),
      contentType: options?.contentType ?? null,
      lastModified: this.clock.now(),
    });
  }

  /** Removes the file under `path`; false when there was none. */
  async delete(path: string): Promise<boolean> {
    return this.files.delete(normalizePath(path));
  }

  /** Every stored key starting with `prefix`, sorted. */
  async list(prefix = ""): Promise<string[]> {
    const wanted = normalizePrefix(prefix);
    return [...this.files.keys()].filter((key) => key.startsWith(wanted)).sort();
  }

  /** The size, write time and content type of the file under `path`. */
  async stat(path: string): Promise<FileStat> {
    const key = normalizePath(path);
    const file = this.find(key);
    return {
      path: key,
      size: file.bytes.byteLength,
      lastModified: new Date(file.lastModified),
      contentType: file.contentType,
    };
  }

  /** The configured base URL followed by the key. */
  url(path: string): string {
    return publicUrl(this.config.url, path);
  }

  /** The public URL with an unsigned `expires` time, for tests that follow a link. */
  async temporaryUrl(path: string, expiresIn: Duration): Promise<string> {
    const expires = new Date(this.clock.now().getTime() + Duration.toMilliseconds(expiresIn));
    return `${this.url(path)}?expires=${encodeURIComponent(expires.toISOString())}`;
  }

  /** The stored file under a normalised key. */
  private find(key: string): StoredFile {
    const file = this.files.get(key);
    if (file === undefined) throw new FileNotFoundError(key);
    return file;
  }
}

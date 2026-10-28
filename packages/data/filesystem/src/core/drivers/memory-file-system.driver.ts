/**
 * Stackra file contract:
 * Purpose: the in-memory `FileSystem` for tests and `disk: "memory"`: the same key, list, stat, move, signed-upload
 *          and URL contract as the real disks, held in `Map`s for the life of the container, plus `receive`, the store's
 *          side of a client's signed `PUT`, so a test uploads exactly as a browser would.
 * Boundary: the memory driver every capability ships first (ADR 0266); isomorphic, so it ships from `.`. It keeps
 *           copies, so a caller that changes its array afterwards does not change the stored file. `temporaryUrl` is
 *           the public URL with an `expires` parameter and no signature: nothing guards a memory disk. URLs use
 *           `filesystem.url`, else `https://files.invalid` (a reserved name nothing resolves), so a test's uploads and
 *           claims work with the default config, as the memory media disk's did. `receive` checks
 *           what S3 checks: a known signature, an unexpired URL and every signed header (the media type) sent
 *           unchanged. Took over `MemoryMediaDiskDriver`'s upload half when media folded into this port (stackra-226).
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 7); ADR 0222 (decision 2); ADR 0266 (memory drivers first); ADR 0294
 *                     (decision 16); ADR 0465.
 */
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";

import type { FilesystemConfig } from "#config/filesystem.config";
import { FileSystem } from "#contracts/ports/file-system.port";
import type { FileStat } from "#contracts/types/file-stat.type";
import type { SignedUpload } from "#contracts/types/signed-upload.type";
import type { UploadRequest } from "#contracts/types/upload-request.type";
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

/** The base of every URL when `filesystem.url` is not set. */
const MEMORY_BASE = "https://files.invalid";

/** What one upload signature allows. */
type UploadGrant = {
  readonly path: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly expiresAt: number;
};

/**
 * Holds files in memory.
 *
 * @example
 * const files = new MemoryFileSystemDriver(buildConfig(FilesystemConfig), clock);
 * await files.write("a/b.txt", "hello");
 * const target = await files.signUpload("uploads/upl_01…", { contentType: "image/png", expiresIn });
 * await files.receive(target.url, target.headers, bytes); // 200
 */
export class MemoryFileSystemDriver extends Driver(FileSystem) {
  private readonly files = new Map<string, StoredFile>();

  private readonly grants = new Map<string, UploadGrant>();

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
    return new Uint8Array(this.find(normalizePath(path)).bytes);
  }

  /** Stores a copy of `contents` under `path`. */
  async write(path: string, contents: Uint8Array | string, options?: WriteOptions): Promise<void> {
    this.files.set(normalizePath(path), {
      bytes:
        typeof contents === "string"
          ? new TextEncoder().encode(contents)
          : new Uint8Array(contents),
      contentType: options?.contentType ?? null,
      lastModified: this.clock.now(),
    });
  }

  /** Moves the stored file under `from` to `to`, as one map change. */
  override async move(from: string, to: string): Promise<void> {
    const source = normalizePath(from);
    const file = this.find(source);
    this.files.set(normalizePath(to), file);
    this.files.delete(source);
  }

  /** A URL carrying a fresh signature that allows one `PUT` under `path` on the request's terms. */
  override async signUpload(path: string, request: UploadRequest): Promise<SignedUpload> {
    const key = normalizePath(path);
    const signature = crypto.randomUUID();
    const headers = { "content-type": request.contentType };
    this.grants.set(signature, {
      path: key,
      headers,
      expiresAt: this.clock.now().getTime() + Duration.toMilliseconds(request.expiresIn),
    });
    return { url: `${this.url(key)}?signature=${signature}`, method: "PUT", headers };
  }

  /**
   * What the store answers to a client's `PUT` of `bytes` to a signed URL.
   *
   * @returns 200 once the file is stored; 403 for an unknown signature, an expired URL or a signed header that is
   *          missing or changed.
   */
  async receive(
    url: string,
    headers: Readonly<Record<string, string>>,
    bytes: Uint8Array,
  ): Promise<200 | 403> {
    const grant = this.grants.get(new URL(url).searchParams.get("signature") ?? "");
    if (grant === undefined || this.clock.now().getTime() > grant.expiresAt) return 403;
    const sent = new Map(
      Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
    );
    if (Object.entries(grant.headers).some(([name, value]) => sent.get(name) !== value)) return 403;
    const contentType = grant.headers["content-type"];
    await this.write(grant.path, bytes, contentType === undefined ? {} : { contentType });
    return 200;
  }

  /** Removes the file under `path`; false when there was none. */
  async delete(path: string): Promise<boolean> {
    return this.files.delete(normalizePath(path));
  }

  /** Every stored key starting with `prefix`, sorted. */
  async list(prefix = ""): Promise<string[]> {
    const wanted = normalizePrefix(prefix);
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
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

  /** The configured base URL, else `https://files.invalid`, followed by the key. */
  url(path: string): string {
    return publicUrl(this.config.url ?? MEMORY_BASE, path);
  }

  /** The public URL with an unsigned `expires` time, for tests that follow a link. */
  async temporaryUrl(path: string, expiresIn: Duration): Promise<string> {
    const expires = new Date(this.clock.now().getTime() + Duration.toMilliseconds(expiresIn));
    return `${this.url(path)}?expires=${encodeURIComponent(expires.toISOString())}`;
  }

  /** The stored file under a normalised key. */
  private find(key: string): StoredFile {
    const file = this.files.get(key);
    if (file === undefined) throw FileNotFoundError.create({ path: key });
    return file;
  }
}

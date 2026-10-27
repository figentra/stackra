/**
 * Stackra file contract:
 * Purpose: the in-memory `MediaDisk` for tests and `disk: "memory"`: the same sign, stat, move and URL contract as the
 *          S3 disk, held in `Map`s for the life of the container, plus `receive`, the store's side of a client's
 *          signed `PUT`, so a test uploads exactly as a browser would.
 * Boundary: the memory driver every capability ships first (ADR 0266); isomorphic, so it ships from `.`. `receive`
 *           checks what S3 checks: a known signature, an unexpired URL and every signed header sent unchanged. URLs
 *           use `filesystem.url`, else `https://media.invalid` (a reserved name nothing resolves). Copies bytes in, so a
 *           caller that changes its array afterwards does not change the stored object.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decisions 1 and 2); ADR 0266 (memory drivers first); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";
import type { FilesystemConfig } from "@stackra/filesystem";
import { FileNotFoundError } from "@stackra/filesystem";

import { MediaDisk } from "#contracts/ports/media-disk.port";
import type { MediaObject } from "#contracts/types/media-object.type";
import type { SignedUpload } from "#contracts/types/signed-upload.type";
import type { UploadRequest } from "#contracts/types/upload-request.type";
import { mediaUrl } from "#core/functions/media-url.function";

/** The base of every URL when `filesystem.url` is not set. */
const MEMORY_BASE = "https://media.invalid";

/** The header prefix of a signed metadata entry. */
const METADATA_HEADER = "x-meta-";

/** One stored object. */
type StoredObject = {
  readonly bytes: Uint8Array;
  readonly contentType: string | null;
  readonly metadata: Readonly<Record<string, string>>;
};

/** What one signature allows. */
type UploadGrant = {
  readonly path: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly expiresAt: number;
};

/**
 * Holds media in memory.
 *
 * @example
 * const disk = new MemoryMediaDiskDriver(buildConfig(FilesystemConfig), clock);
 * const target = await disk.signUpload("uploads/upl_01…", request);
 * await disk.receive(target.url, target.headers, bytes); // 200
 */
export class MemoryMediaDiskDriver extends Driver(MediaDisk) {
  private readonly objects = new Map<string, StoredObject>();

  private readonly grants = new Map<string, UploadGrant>();

  private readonly base: string;

  private readonly clock: Clock;

  /**
   * @param files - the public base URL (`url`), shared with the file disks.
   * @param clock - the time source of URL expiry.
   */
  constructor(files: FilesystemConfig, clock: Clock) {
    super();
    this.base = files.url ?? MEMORY_BASE;
    this.clock = clock;
  }

  /** A URL carrying a fresh signature that allows one `PUT` at `path` on the request's terms. */
  async signUpload(path: string, request: UploadRequest): Promise<SignedUpload> {
    const signature = crypto.randomUUID();
    const headers: Record<string, string> = { "content-type": request.contentType };
    for (const [name, value] of Object.entries(request.metadata))
      headers[`${METADATA_HEADER}${name}`] = value;
    this.grants.set(signature, {
      path,
      headers,
      expiresAt: this.clock.now().getTime() + Duration.toMilliseconds(request.expiresIn),
    });
    return { url: `${this.url(path)}?signature=${signature}`, method: "PUT", headers };
  }

  /**
   * What the store answers to a client's `PUT` of `bytes` to a signed URL.
   *
   * @returns 200 once the object is stored; 403 for an unknown signature, an expired URL or a signed header that is
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
    const metadata: Record<string, string> = {};
    for (const [name, value] of Object.entries(grant.headers))
      if (name.startsWith(METADATA_HEADER)) metadata[name.slice(METADATA_HEADER.length)] = value;
    this.objects.set(grant.path, {
      bytes: bytes.slice(),
      contentType: grant.headers["content-type"] ?? null,
      metadata,
    });
    return 200;
  }

  /** The size, media type and metadata of the object at `path`, or `null`. */
  async stat(path: string): Promise<MediaObject | null> {
    const object = this.objects.get(path);
    if (object === undefined) return null;
    return {
      size: object.bytes.byteLength,
      contentType: object.contentType,
      metadata: { ...object.metadata },
    };
  }

  /** Moves the object at `from` to `to`, as S3's copy and delete do. */
  async move(from: string, to: string): Promise<void> {
    const object = this.objects.get(from);
    if (object === undefined) throw new FileNotFoundError(from);
    this.objects.set(to, object);
    this.objects.delete(from);
  }

  /** Removes the object at `path`; false when there was none. */
  async delete(path: string): Promise<boolean> {
    return this.objects.delete(path);
  }

  /** The base URL followed by the path. */
  url(path: string): string {
    return mediaUrl(this.base, path);
  }

  /** The URL with an unsigned `expires` time, for tests that follow a link. */
  async temporaryUrl(path: string, expiresIn: Duration): Promise<string> {
    const expires = new Date(this.clock.now().getTime() + Duration.toMilliseconds(expiresIn));
    return `${this.url(path)}?expires=${encodeURIComponent(expires.toISOString())}`;
  }
}

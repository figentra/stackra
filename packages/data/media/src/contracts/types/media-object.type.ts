/**
 * Stackra file contract:
 * Purpose: `MediaObject`, what `MediaDisk.stat` reports for one stored object: its size, its media type and the
 *          metadata it was uploaded with.
 * Boundary: a type only. A field the store did not keep is `null` (media type) or absent (a metadata entry).
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2); ADR 0294 (decision 15).
 */

/** The facts of one stored object. */
export interface MediaObject {
  /** Size in bytes. */
  readonly size: number;

  /** The media type the object was stored with; `null` when the store kept none. */
  readonly contentType: string | null;

  /** The metadata the object was stored with, names lowercase. */
  readonly metadata: Readonly<Record<string, string>>;
}

/**
 * Stackra file contract:
 * Purpose: `IcoImage`, one PNG `encodeIco` packs into an `.ico` file, with its square size.
 * Boundary: a type of the `.` entry; no runtime value.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: favicons).
 */

/** One PNG and its square size in px (1 to 256). */
export interface IcoImage {
  /** The square size in px, 1 to 256. */
  readonly size: number;

  /** The encoded PNG bytes. */
  readonly png: Uint8Array;
}

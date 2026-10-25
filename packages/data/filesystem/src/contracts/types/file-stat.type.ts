/**
 * Stackra file contract:
 * Purpose: `FileStat`, what `FileSystem.stat` returns for one stored file.
 * Boundary: a type only. A field a driver cannot know is `null` (the local disk keeps no content type; an Encore
 *           bucket reports no modification time).
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 7); ADR 0294 (decision 15: types live in the contracts leaf).
 */

/** The facts of one stored file. */
export interface FileStat {
  /** The normalised key (`invoices/2026/inv_01.pdf`). */
  readonly path: string;

  /** Size in bytes. */
  readonly size: number;

  /** When the file was last written; `null` when the driver does not know. */
  readonly lastModified: Date | null;

  /** The media type given at write time; `null` when the driver does not keep one. */
  readonly contentType: string | null;
}

/**
 * Stackra file contract:
 * Purpose: `ZipEntry`, one file `writeZip` puts in an archive: its path inside the archive, its bytes as a stream and
 *          whether it is deflated or stored.
 * Boundary: a type only; `writeZip` iterates `bytes` once and never holds the whole file.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 2); APPNOTE.TXT 4.3 and 4.4.
 */
import type { TabularSource } from "#contracts/types/tabular-source.type";

/** One file of a zip archive. */
export interface ZipEntry {
  /** The path inside the archive, `/`-separated, written as UTF-8 (`models/orders.jsonl`). */
  readonly name: string;

  /** The file's chunks, in order. */
  readonly bytes: TabularSource;

  /** `deflate` (the default) or `store`, for bytes that are already compressed (images, PDFs, nested archives). */
  readonly method?: "deflate" | "store";
}

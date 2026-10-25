/**
 * Stackra file contract:
 * Purpose: `PreviewOptions`, a read's options plus how many data rows per sheet the preview keeps.
 * Boundary: a type only; `rows` is the caller's preview-size setting.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 4 and 5).
 */
import type { TabularReadOptions } from "#contracts/types/tabular-read-options.type";

/** Options of a preview. */
export interface PreviewOptions extends TabularReadOptions {
  /** Data rows kept per sheet. */
  readonly rows: number;
}

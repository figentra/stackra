/**
 * Stackra file contract:
 * Purpose: `SourceChipContractProps`, the props every runtime's `SourceChip` takes: one citation as a small pill, a
 *          link for a web page or a plain pill for a document, with its favicon or a letter.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (component gaps, owner approval
 *          2026-10-31).
 */
import type { SourceItem } from "#contracts/types/source-item.type";

/** Props shared by the web and native `SourceChip`. */
export interface SourceChipContractProps {
  /** The source. */
  readonly source: SourceItem;
}

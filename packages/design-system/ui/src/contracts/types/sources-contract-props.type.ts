/**
 * Stackra file contract:
 * Purpose: `SourcesContractProps`, the props every runtime's `Sources` takes: an answer's citations behind a quiet
 *          "3 sources" toggle with stacked favicons, opening to a wrapping list of `SourceChip`s.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (component gaps, owner approval
 *          2026-10-31).
 */
import type { SourceItem } from "#contracts/types/source-item.type";

/** Props shared by the web and native `Sources`. */
export interface SourcesContractProps {
  /** The sources, in the order cited. */
  readonly sources: readonly SourceItem[];
  /** The toggle's words. Defaults to the catalogue's "{count} sources". */
  readonly summary?: string | undefined;
  /** True while open, for a controlled list; pair it with `onExpandedChange`. */
  readonly isExpanded?: boolean | undefined;
  /** True to start open, for an uncontrolled list. */
  readonly defaultExpanded?: boolean | undefined;
  /** Called with the new state each time the list opens or closes. */
  readonly onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
}

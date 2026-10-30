/**
 * Stackra file contract:
 * Purpose: `ShimmerContractProps`, the props every runtime's `Shimmer` takes: a line of text with a light passing over
 *          it in the reading direction ("Thinking…"), or lines of placeholder blocks while an answer loads.
 * Boundary: types only; the block kind is the Skeleton, composed, not a second placeholder.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** Props shared by the web and native `Shimmer`. */
export interface ShimmerContractProps {
  /** `text` (the default) shimmers the words; `block` draws placeholder lines. */
  readonly kind?: "text" | "block" | undefined;
  /** The words of the text kind, and the loading region's name for the block kind. Defaults to "Thinking…". */
  readonly children?: string | undefined;
  /** How many placeholder lines the block kind draws; defaults to 3. */
  readonly lines?: number | undefined;
}

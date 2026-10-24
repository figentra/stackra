/**
 * Stackra file contract:
 * Purpose: the props the web `TextShimmer` takes from the shared vocabulary: the text that shimmers.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ReactNode } from "react";

/** Props of `TextShimmer`. */
export interface TextShimmerContractProps {
  /** The text that carries the moving highlight. */
  readonly children: ReactNode;
}

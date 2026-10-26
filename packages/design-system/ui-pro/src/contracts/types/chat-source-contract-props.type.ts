/**
 * Stackra file contract:
 * Purpose: the props the web `ChatSource` and `ChatSources` compounds take from the shared vocabulary: their
 *          children, the custom chip and the list of chips.
 * Boundary: types only; web only. Every other prop (`href`, `title`, `sourceType`, `enablePreview`, the disclosure
 *          props) is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ReactNode } from "react";

/** Props of the `ChatSource` root. */
export interface ChatSourceContractProps {
  /** The chip's custom parts (trigger and preview). Drawn from `title`, `href` and `description` when left out. */
  readonly children?: ReactNode | undefined;
}

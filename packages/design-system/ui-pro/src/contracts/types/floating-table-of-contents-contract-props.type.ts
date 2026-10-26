/**
 * Stackra file contract:
 * Purpose: the props the web `FloatingTableOfContents` compound (HeroUI Pro's FloatingToc) takes from the shared vocabulary: the controlled open state, the active state of its bars and items, and the accessible name of its trigger.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { ReactNode } from "react";

/** Props of the `FloatingTableOfContents` root that the Stackra vocabulary names. */
export interface FloatingTableOfContentsContractProps {
  /** The trigger with its bars, and the content that opens from it. */
  readonly children: ReactNode;
  /** The controlled open state; HeroUI Pro's `open`. Uncontrolled when left out. */
  readonly isOpen?: boolean | undefined;
}

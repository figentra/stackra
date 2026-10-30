/**
 * Stackra file contract:
 * Purpose: `MessageScrollerContractProps`, the props every runtime's `MessageScroller` takes: the messages and its
 *          name.
 * Boundary: types only; the scroller decides when it sticks to the bottom.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `MessageScroller`. */
export interface MessageScrollerContractProps {
  /** The messages, oldest first, one child each: the jump button counts the children added since the person left. */
  readonly children?: ReactNode;
  /** The region's accessible name. Defaults to the catalogue's "Conversation". */
  readonly label?: string | undefined;
}

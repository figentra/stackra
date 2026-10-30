/**
 * Stackra file contract:
 * Purpose: `MessageScrollerProps`, the props of the web `MessageScroller`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { MessageScrollerContractProps } from "#contracts/types/message-scroller-contract-props.type";

/** Props of the web MessageScroller. */
export type MessageScrollerProps = MessageScrollerContractProps & {
  /** Styles the scrolling region; give it a height (or a flex parent) so it can scroll. */
  readonly className?: string | undefined;
};

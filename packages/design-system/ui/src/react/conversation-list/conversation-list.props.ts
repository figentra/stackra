/**
 * Stackra file contract:
 * Purpose: `ConversationListProps`, the props of the web `ConversationList`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { ConversationListContractProps } from "#contracts/types/conversation-list-contract-props.type";

/** Props of the web ConversationList. */
export type ConversationListProps = ConversationListContractProps & {
  /** Styles the list. */
  readonly className?: string | undefined;
};

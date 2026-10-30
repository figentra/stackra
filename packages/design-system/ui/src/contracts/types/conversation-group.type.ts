/**
 * Stackra file contract:
 * Purpose: `ConversationGroup`, one group of a ConversationList (Pinned, Today, Yesterday, Previous 7 days, Older) with
 *          its conversations, newest first.
 * Boundary: types only; `groupConversations` builds them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ConversationGroupId } from "#contracts/enums/conversation-group-id.enum";
import type { ConversationSummary } from "#contracts/types/conversation-summary.type";

/** One group of conversations. */
export interface ConversationGroup {
  /** Which group it is; the runtime names it from the catalogue. */
  readonly id: ConversationGroupId;
  /** Its conversations, newest first; never empty. */
  readonly items: readonly ConversationSummary[];
}

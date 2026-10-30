/**
 * Stackra file contract:
 * Purpose: `ConversationListContractProps`, the props every runtime's `ConversationList` takes: the past
 *          conversations, the one open, and what pin, rename and delete do.
 * Boundary: types only; renaming and deleting are the app's (it opens its own field or confirmation).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ConversationSummary } from "#contracts/types/conversation-summary.type";

/** Props shared by the web and native `ConversationList`. */
export interface ConversationListContractProps {
  /** The past conversations, in any order; the list groups them by day and puts pinned ones first. */
  readonly conversations: readonly ConversationSummary[];
  /** The id of the conversation that is open, drawn selected. */
  readonly selectedId?: string | null | undefined;
  /** Called with a conversation's id when it is chosen. */
  readonly onSelect?: ((id: string) => void) | undefined;
  /** Called with the id and the new state when Pin or Unpin is chosen; the menu offers it only when set. */
  readonly onPinChange?: ((id: string, isPinned: boolean) => void) | undefined;
  /** Called with the id when Rename is chosen; the menu offers it only when set. */
  readonly onRename?: ((id: string) => void) | undefined;
  /** Called with the id when Delete is chosen; the menu offers it only when set. */
  readonly onDelete?: ((id: string) => void) | undefined;
  /** The list's accessible name. Defaults to the catalogue's "Conversations". */
  readonly label?: string | undefined;
  /** "Now", for a fixed point in a test or a demo; defaults to the moment the list mounted. */
  readonly now?: Date | undefined;
}

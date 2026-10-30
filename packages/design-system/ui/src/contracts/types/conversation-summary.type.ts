/**
 * Stackra file contract:
 * Purpose: `ConversationSummary`, one past AI conversation as a ConversationList draws it: its title, the last
 *          message's first words, when it last changed and whether it is pinned.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** One past conversation. */
export interface ConversationSummary {
  /** The key the list's selection and actions report; unique within the list. */
  readonly id: string;
  /** The conversation's title, for example "Return for order 2048". */
  readonly title: string;
  /** The last message's first words, drawn muted under the title. */
  readonly preview?: string | undefined;
  /** When the conversation last changed: a `Date`, or an ISO 8601 string as an API sends it. */
  readonly updatedAt: Date | string;
  /** True to keep it in the Pinned group at the top. */
  readonly isPinned?: boolean | undefined;
}

/**
 * Stackra file contract:
 * Purpose: the groups a ConversationList sorts past conversations into, in the order they are drawn: pinned first,
 *          then by when each conversation last changed.
 * Boundary: the values only; `groupConversations` sorts into them and each runtime names them from the catalogue.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** The conversation groups, in drawing order. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the labels live in the catalogue.
export const ConversationGroupId = Object.freeze([
  "pinned",
  "today",
  "yesterday",
  "previous_7_days",
  "older",
] as const);

/** One conversation group. */
export type ConversationGroupId = (typeof ConversationGroupId)[number];

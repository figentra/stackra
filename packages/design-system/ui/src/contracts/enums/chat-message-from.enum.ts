/**
 * Stackra file contract:
 * Purpose: who wrote a `ChatMessage`: the person (`user`) or the assistant.
 * Boundary: the values only; the spoken names live in the catalogue (`ui::chat_message.*`).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); STA-1371 (component gaps, owner approval 2026-10-31).
 */

/** The authors of a chat message. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the labels live in the catalogue.
export const ChatMessageFrom = Object.freeze(["user", "assistant"] as const);

/** One author of a chat message. */
export type ChatMessageFrom = (typeof ChatMessageFrom)[number];

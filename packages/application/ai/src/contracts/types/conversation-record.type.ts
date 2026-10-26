/**
 * Stackra file contract:
 * Purpose: `ConversationRecord`, one stored conversation between a principal and an agent: who it belongs to, the
 *          agent, the scope node and the record it is about.
 * Boundary: a type only; the `ConversationStore` answers it. It carries no text: messages are separate, and their text
 *           rests encrypted under the owning tenant's key (ADR 0100 decision 9).
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 9 and 10: `ai_conversations`); STA-781.
 */
import type { RecordScope } from "#contracts/types/record-scope.type";

/** A stored conversation. */
export interface ConversationRecord {
  /** The conversation's public id. */
  readonly id: string;

  /** The agent's key. */
  readonly agent: string;

  /** The human principal it belongs to (the one an agent acts for). */
  readonly principalId: string;

  /** The scope node it was opened in; absent for a platform conversation. */
  readonly scopeId?: string;

  /** The record it is about (a matter); absent when none. */
  readonly record?: RecordScope;

  /** When it was opened. */
  readonly createdAt: Date;
}

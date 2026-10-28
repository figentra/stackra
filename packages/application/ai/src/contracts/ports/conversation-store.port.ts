/**
 * Stackra file contract:
 * Purpose: the `ConversationStore` port: opens and reads conversations and keeps their messages, the only place an
 *          agent's prompt and response text is stored.
 * Boundary: an abstract class that is its own token, keyed `ai.ConversationStore`. The Postgres driver in `./node`
 *           stores `ai.conversations` and `ai.messages` under the tenant's row-level security, each message's content
 *           sealed by `HasEncryptedFields({ scope })` bound to its tenant (ADR 0476); the memory driver in `.` serves
 *           tests and local runs. Messages are AI SDK `ModelMessage`s, kept in order. `forget` erases a principal's
 *           conversations for a subject's erasure.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 9 and 10); ADR 0399 (storage home); STA-781; ADR 0476; ADR 0189 (decision
 *                     2: erasure reaches every copy), data-layer gap gov6.
 */
import { Port } from "@stackra/contracts";
import type { ModelMessage } from "ai";

import type { ConversationRecord } from "#contracts/types/conversation-record.type";
import type { RecordScope } from "#contracts/types/record-scope.type";

/**
 * Stores conversations and their ordered messages, one tenant at a time.
 *
 * @example
 * const conversation = await conversations.open({ agent: "matter_assistant", principalId: "usr_1" });
 * await conversations.append(conversation.id, run.id, [{ role: "user", content: "Draft the reply" }]);
 */
export abstract class ConversationStore extends Port {
  /** Type-only port key, so `DriverName<ConversationStore>` narrows to this port's drivers. */
  declare readonly "~key": "ai.ConversationStore";

  /** Opens a new conversation. */
  abstract open(conversation: {
    readonly agent: string;
    readonly principalId: string;
    readonly scopeId?: string;
    readonly record?: RecordScope;
  }): Promise<ConversationRecord>;

  /** The conversation with `id`, or `undefined` when none is visible. */
  abstract get(id: string): Promise<ConversationRecord | undefined>;

  /** The conversation's messages, oldest first. */
  abstract messages(conversationId: string): Promise<readonly ModelMessage[]>;

  /** Appends `messages`, in order, as written by `runId`. */
  abstract append(
    conversationId: string,
    runId: string,
    messages: readonly ModelMessage[],
  ): Promise<void>;

  /**
   * Erases every visible conversation of `principalId` with its messages, for a subject's erasure; a message a legal
   * hold covers stays, and so does its conversation. Idempotent.
   *
   * @returns how many conversations it removed.
   */
  abstract forget(principalId: string): Promise<number>;
}

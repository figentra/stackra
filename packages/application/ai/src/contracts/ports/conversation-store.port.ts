/**
 * Stackra file contract:
 * Purpose: the `ConversationStore` port: opens and reads conversations and keeps their messages, the only place an
 *          agent's prompt and response text is stored.
 * Boundary: an abstract class that is its own token, keyed `ai.ConversationStore`. The Postgres driver in `./node`
 *           stores `ai.conversations` and `ai.messages` under the tenant's row-level security, each message's content
 *           sealed with `ScopeKeyCast`; the memory driver in `.` serves tests and local runs. Messages are AI SDK
 *           `ModelMessage`s, kept in order.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 9 and 10); ADR 0399 (storage home); STA-781.
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
}

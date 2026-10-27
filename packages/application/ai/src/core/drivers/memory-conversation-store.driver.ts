/**
 * Stackra file contract:
 * Purpose: `MemoryConversationStoreDriver`, the in-process `ConversationStore`: conversations and their messages in
 *          maps, for tests, local runs and evals.
 * Boundary: one process only and unencrypted, so it never holds production text; a service binds the Postgres driver
 *           of `./node`, which seals every message with the tenant's key. Ids are random `aiconv_` public ids.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 9 and 10); STA-781.
 */
import { Driver } from "@stackra/container";
import type { ModelMessage } from "ai";

import { ConversationStore } from "#contracts/ports/conversation-store.port";
import type { ConversationRecord } from "#contracts/types/conversation-record.type";
import type { RecordScope } from "#contracts/types/record-scope.type";

/**
 * Keeps conversations in memory.
 *
 * @example
 * const conversations = new MemoryConversationStoreDriver();
 * const runtime = new AgentRuntime(conversations, runs, dispatcher, models, instructions, queue, clock, meter, discovery);
 */
export class MemoryConversationStoreDriver extends Driver(ConversationStore) {
  /** The conversations by id. */
  private readonly rows = new Map<string, ConversationRecord>();

  /** The messages by conversation id, with the run that wrote each. */
  private readonly lines = new Map<
    string,
    { readonly runId: string; readonly message: ModelMessage }[]
  >();

  /** Implements `ConversationStore.open`, documented there. */
  async open(conversation: {
    readonly agent: string;
    readonly principalId: string;
    readonly scopeId?: string;
    readonly record?: RecordScope;
  }): Promise<ConversationRecord> {
    const row: ConversationRecord = Object.freeze({
      id: `aiconv_${globalThis.crypto.randomUUID().replaceAll("-", "")}`,
      ...conversation,
      createdAt: new Date(),
    });
    this.rows.set(row.id, row);
    this.lines.set(row.id, []);
    return row;
  }

  /** Implements `ConversationStore.get`, documented there. */
  async get(id: string): Promise<ConversationRecord | undefined> {
    return this.rows.get(id);
  }

  /** Implements `ConversationStore.messages`, documented there. */
  async messages(conversationId: string): Promise<readonly ModelMessage[]> {
    return (this.lines.get(conversationId) ?? []).map((line) => structuredClone(line.message));
  }

  /**
   * Implements `ConversationStore.append`, documented there.
   *
   * @throws RangeError when the conversation was never opened here.
   */
  async append(
    conversationId: string,
    runId: string,
    messages: readonly ModelMessage[],
  ): Promise<void> {
    const lines = this.lines.get(conversationId);
    if (lines === undefined) throw new RangeError(`No conversation ${conversationId}`);
    for (const message of messages) lines.push({ runId, message: structuredClone(message) });
  }
}

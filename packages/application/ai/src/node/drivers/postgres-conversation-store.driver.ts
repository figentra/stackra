/**
 * Stackra file contract:
 * Purpose: `PostgresConversationStoreDriver`, the `ConversationStore` over `ai.conversations` and `ai.messages`: opens
 *          conversations, appends messages in order and reads them back; `Message.content` rests sealed and bound
 *          to the owning tenant by `HasEncryptedFields({ scope })`, so this driver handles only plain text.
 * Boundary: a driver over `Repository<Conversation>` and `Repository<Message>`, so every read and write runs in the
 *           caller's tenant session under row-level security; a conversation of another tenant is never visible. A
 *           message's position is the next after the stored ones; two writers racing on one conversation collide on
 *           the unique (conversation, position) index rather than interleave. Sealing and opening are the
 *           `EncryptedFieldsSubscriber`'s, which the generated boot registers; the repository writes through the unit of
 *           work, so the content is never written in clear.
 * Runtime: node
 * Governing contract: ADR 0100 (decisions 9 and 10); ADR 0188 (decision 2); ADR 0399; STA-781; ADR 0476.
 */
import { Driver } from "@stackra/container";
import type { Repository } from "@stackra/database";
import type { ModelMessage } from "ai";

import { ConversationStore } from "#contracts/ports/conversation-store.port";
import type { ConversationRecord } from "#contracts/types/conversation-record.type";
import type { RecordScope } from "#contracts/types/record-scope.type";
import type { Conversation } from "#node/models/conversation.model";
import type { Message } from "#node/models/message.model";

/** A conversation row as the port's record. */
function recordOf(row: Conversation): ConversationRecord {
  return Object.freeze({
    id: row.id,
    agent: row.agent,
    principalId: row.principalId,
    ...(row.scopeId === null ? {} : { scopeId: row.scopeId }),
    ...(row.recordKind === null
      ? {}
      : {
          record: { kind: row.recordKind, ...(row.recordId === null ? {} : { id: row.recordId }) },
        }),
    createdAt: row.createdAt,
  });
}

/**
 * Stores conversations in Postgres.
 *
 * @example
 * container.bind(ConversationStore, PostgresConversationStoreDriver);
 */
export class PostgresConversationStoreDriver extends Driver(ConversationStore) {
  private readonly conversations: Repository<Conversation>;

  private readonly rows: Repository<Message>;

  /**
   * @param conversations - the conversation rows.
   * @param rows - the message rows.
   */
  constructor(conversations: Repository<Conversation>, rows: Repository<Message>) {
    super();
    this.conversations = conversations;
    this.rows = rows;
  }

  /** Implements `ConversationStore.open`, documented there. */
  async open(conversation: {
    readonly agent: string;
    readonly principalId: string;
    readonly scopeId?: string;
    readonly record?: RecordScope;
  }): Promise<ConversationRecord> {
    const row = await this.conversations.insert({
      agent: conversation.agent,
      principalId: conversation.principalId,
      scopeId: conversation.scopeId ?? null,
      recordKind: conversation.record?.kind ?? null,
      recordId: conversation.record?.id ?? null,
    });
    return recordOf(row);
  }

  /** Implements `ConversationStore.get`, documented there. */
  async get(id: string): Promise<ConversationRecord | undefined> {
    const row = await this.conversations.findOne({ id } as never);
    return row === null ? undefined : recordOf(row as Conversation);
  }

  /** Implements `ConversationStore.messages`, documented there. */
  async messages(conversationId: string): Promise<readonly ModelMessage[]> {
    const rows = (await this.rows.find(
      { conversationId } as never,
      {
        orderBy: { position: "asc" },
      } as never,
    )) as Message[];
    return rows.map((row) => JSON.parse(row.content) as ModelMessage);
  }

  /**
   * Implements `ConversationStore.append`, documented there.
   *
   * @throws RangeError when the conversation is not visible.
   */
  async append(
    conversationId: string,
    runId: string,
    messages: readonly ModelMessage[],
  ): Promise<void> {
    const conversation = (await this.conversations.findOne({
      id: conversationId,
    } as never)) as Conversation | null;
    if (conversation === null) throw new RangeError(`No conversation ${conversationId}`);
    let position = await this.rows.count({ conversationId } as never);
    for (const message of messages) {
      await this.rows.insert({
        conversationId,
        runId,
        position,
        role: message.role,
        content: JSON.stringify(message),
        at: new Date(),
      });
      position += 1;
    }
  }

  /**
   * Implements `ConversationStore.forget`, documented there: purges the messages (`purge` skips held rows, and an
   * append-only row may still be purged), then each conversation with no message left. Runs under the caller's scope,
   * so row-level security limits it to the conversations it may see.
   */
  async forget(principalId: string): Promise<number> {
    const owned = (await this.conversations.find({ principalId } as never)) as Conversation[];
    const ids = owned.map((row) => row.id);
    if (ids.length === 0) return 0;
    await this.rows.purge({ conversationId: { $in: ids } } as never);
    const held = new Set(
      ((await this.rows.find({ conversationId: { $in: ids } } as never)) as Message[]).map(
        (row) => row.conversationId,
      ),
    );
    const free = ids.filter((id) => !held.has(id));
    return free.length === 0 ? 0 : this.conversations.purge({ id: { $in: free } } as never);
  }
}

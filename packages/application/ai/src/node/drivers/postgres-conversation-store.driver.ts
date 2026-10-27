/**
 * Stackra file contract:
 * Purpose: `PostgresConversationStoreDriver`, the `ConversationStore` over `ai.conversations` and `ai.messages`: opens
 *          conversations, appends messages in order with their content sealed by `ScopeKeyCast` (bound to the
 *          owning tenant), and reads them back opened.
 * Boundary: a driver over `Repository<Conversation>` and `Repository<Message>`, so every read and write runs in the
 *           caller's tenant session under row-level security; a conversation of another tenant is never visible. A
 *           message's position is the next after the stored ones; two writers racing on one conversation collide on
 *           the unique (conversation, position) index rather than interleave.
 * Runtime: node
 * Governing contract: ADR 0100 (decisions 9 and 10); ADR 0188 (decision 2); ADR 0399; STA-781.
 */
import { Driver } from "@stackra/container";
import type { Repository } from "@stackra/database";
import type { ModelMessage } from "ai";

import { ConversationStore } from "#contracts/ports/conversation-store.port";
import type { ConversationRecord } from "#contracts/types/conversation-record.type";
import type { RecordScope } from "#contracts/types/record-scope.type";
import type { ScopeKeyCast } from "#node/casts/scope-key.cast";
import type { Conversation } from "#node/models/conversation.model";
import type { Message } from "#node/models/message.model";

/** The column a message's content is sealed for. */
const CONTENT = "ai.messages.content";

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

  private readonly cast: ScopeKeyCast;

  /**
   * @param conversations - the conversation rows.
   * @param rows - the message rows.
   * @param cast - seals and opens message content with the tenant's key.
   */
  constructor(
    conversations: Repository<Conversation>,
    rows: Repository<Message>,
    cast: ScopeKeyCast,
  ) {
    super();
    this.conversations = conversations;
    this.rows = rows;
    this.cast = cast;
  }

  /** See `ConversationStore.open`. */
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

  /** See `ConversationStore.get`. */
  async get(id: string): Promise<ConversationRecord | undefined> {
    const row = await this.conversations.findOne({ id } as never);
    return row === null ? undefined : recordOf(row as Conversation);
  }

  /** See `ConversationStore.messages`. */
  async messages(conversationId: string): Promise<readonly ModelMessage[]> {
    const rows = (await this.rows.find(
      { conversationId } as never,
      {
        orderBy: { position: "asc" },
      } as never,
    )) as Message[];
    return Promise.all(
      rows.map(
        async (row) =>
          JSON.parse(
            await this.cast.open(row.content, { column: CONTENT, scopeId: row.tenantId }),
          ) as ModelMessage,
      ),
    );
  }

  /**
   * See `ConversationStore.append`.
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
      const content = await this.cast.seal(JSON.stringify(message), {
        column: CONTENT,
        scopeId: conversation.tenantId,
      });
      await this.rows.insert({
        conversationId,
        runId,
        position,
        role: message.role,
        content,
        at: new Date(),
      });
      position += 1;
    }
  }
}

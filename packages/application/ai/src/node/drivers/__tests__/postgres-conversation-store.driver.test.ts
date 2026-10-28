/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresConversationStoreDriver`: it opens conversations with their record, appends messages
 *          at the next positions with the content sealed for the owning tenant (no plain text in the row), reads them
 *          back opened in order, refuses an append to an unseen conversation, and forgets a principal's conversations
 *          (a held message keeps its conversation).
 * Boundary: test only; the repositories are in-memory stand-ins with the tenant the trait would fill, and the cast is
 *           the real one over the AES-GCM cipher and a fixed test key. The SQL side is the migration's test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0100 (decisions 9 and 10); ADR 0399.
 */
import { AesGcmFieldCipherDriver, MemoryKeyProviderDriver } from "@stackra/contracts";
import type { Repository } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { ConversationStore } from "#contracts/ports/conversation-store.port";
import { ScopeKeyCast } from "#node/casts/scope-key.cast";
import { PostgresConversationStoreDriver } from "#node/drivers/postgres-conversation-store.driver";
import type { Conversation } from "#node/models/conversation.model";
import type { Message } from "#node/models/message.model";

/**
 * An in-memory repository: equality and `$in` `where`, one `orderBy` key, ids minted with `prefix`, and a `purge` that
 * skips the ids in `held` (a legal hold).
 */
function rowsOf<M extends object>(
  prefix: string,
): Repository<M> & { readonly rows: M[]; readonly held: Set<string> } {
  const rows: M[] = [];
  const held = new Set<string>();
  const matches = (row: M, where: object) =>
    Object.entries(where).every(([key, value]) => {
      const actual = (row as Record<string, unknown>)[key];
      return typeof value === "object" && value !== null && "$in" in value
        ? (value.$in as unknown[]).includes(actual)
        : actual === value;
    });
  return {
    rows,
    held,
    purge: async (where: object) => {
      const gone = rows.filter(
        (row) => matches(row, where) && !held.has((row as { id: string }).id),
      );
      for (const row of gone) rows.splice(rows.indexOf(row), 1);
      return gone.length;
    },
    insert: async (data: object) => {
      const row = {
        id: `${prefix}_${rows.length + 1}`,
        tenantId: "scp_a",
        createdAt: new Date(),
        ...data,
      } as M;
      rows.push(row);
      return row;
    },
    findOne: async (where: object) => rows.find((row) => matches(row, where)) ?? null,
    find: async (where: object, options?: { orderBy?: Record<string, "asc"> }) => {
      const found = rows.filter((row) => matches(row, where));
      const [key] = Object.keys(options?.orderBy ?? {});
      return key === undefined
        ? found
        : found.sort(
            (a, b) =>
              ((a as Record<string, number>)[key] ?? 0) - ((b as Record<string, number>)[key] ?? 0),
          );
    },
    count: async (where: object = {}) => rows.filter((row) => matches(row, where)).length,
  } as unknown as Repository<M> & { readonly rows: M[]; readonly held: Set<string> };
}

describe(PostgresConversationStoreDriver, () => {
  it("seals messages for the owning tenant and reads them back in order", async () => {
    const conversations = rowsOf<Conversation>("aiconv");
    const messages = rowsOf<Message>("aimsg");
    const cast = new ScopeKeyCast(
      new AesGcmFieldCipherDriver(
        new MemoryKeyProviderDriver([{ id: "k1", key: new Uint8Array(32).fill(3) }]),
      ),
    );
    const store = new PostgresConversationStoreDriver(conversations, messages, cast);
    expect(store).toBeInstanceOf(ConversationStore);
    const opened = await store.open({
      agent: "matter_assistant",
      principalId: "usr_1",
      record: { kind: "matter", id: "mtr_1" },
    });
    expect(opened).toMatchObject({
      agent: "matter_assistant",
      record: { kind: "matter", id: "mtr_1" },
    });
    await store.append(opened.id, "airun_1", [
      { role: "user", content: "Privileged question" },
      { role: "assistant", content: "Privileged answer" },
    ]);
    expect(messages.rows.map((row) => row.position)).toEqual([0, 1]);
    expect(messages.rows.some((row) => row.content.includes("Privileged"))).toBe(false);
    expect(await store.messages(opened.id)).toEqual([
      { role: "user", content: "Privileged question" },
      { role: "assistant", content: "Privileged answer" },
    ]);
    expect(await store.get("aiconv_missing")).toBeUndefined();
    await expect(store.append("aiconv_missing", "airun_1", [])).rejects.toThrow(RangeError);
  });

  it("forgets a principal's conversations and messages, keeping a held message's conversation", async () => {
    const conversations = rowsOf<Conversation>("aiconv");
    const messages = rowsOf<Message>("aimsg");
    const cast = new ScopeKeyCast(
      new AesGcmFieldCipherDriver(
        new MemoryKeyProviderDriver([{ id: "k1", key: new Uint8Array(32).fill(3) }]),
      ),
    );
    const store = new PostgresConversationStoreDriver(conversations, messages, cast);
    const first = await store.open({ agent: "assistant", principalId: "usr_1" });
    const second = await store.open({ agent: "assistant", principalId: "usr_1" });
    const other = await store.open({ agent: "assistant", principalId: "usr_2" });
    await store.append(first.id, "airun_1", [{ role: "user", content: "One" }]);
    await store.append(second.id, "airun_2", [{ role: "user", content: "Two" }]);
    await store.append(other.id, "airun_3", [{ role: "user", content: "Three" }]);
    const heldMessage = messages.rows.find((row) => row.conversationId === second.id);
    messages.held.add(heldMessage?.id ?? "");
    expect(await store.forget("usr_1")).toBe(1);
    expect(conversations.rows.map((row) => row.id)).toEqual([second.id, other.id]);
    expect(messages.rows.map((row) => row.conversationId)).toEqual([second.id, other.id]);
    expect(await store.forget("usr_9")).toBe(0);
  });
});

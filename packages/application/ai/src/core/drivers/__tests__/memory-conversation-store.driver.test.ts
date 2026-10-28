/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryConversationStoreDriver`: it is a `ConversationStore`, opens conversations with
 *          `aiconv_` ids, keeps messages in order as copies, refuses an append to an unknown conversation, and forgets a
 *          principal's conversations.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0100 (decision 10); STA-781.
 */
import { describe, expect, it } from "@stackra/testing";
import type { ModelMessage } from "ai";

import { ConversationStore } from "#contracts/ports/conversation-store.port";
import { MemoryConversationStoreDriver } from "#core/drivers/memory-conversation-store.driver";

describe(MemoryConversationStoreDriver, () => {
  it("opens conversations and keeps their messages in order", async () => {
    const store = new MemoryConversationStoreDriver();
    expect(store).toBeInstanceOf(ConversationStore);
    const opened = await store.open({
      agent: "matter_assistant",
      principalId: "usr_1",
      record: { kind: "matter", id: "mtr_1" },
    });
    expect(opened.id).toMatch(/^aiconv_[0-9a-f]{32}$/);
    expect(await store.get(opened.id)).toEqual(opened);
    const first: ModelMessage = { role: "user", content: "Hi" };
    await store.append(opened.id, "airun_1", [first, { role: "assistant", content: "Hello" }]);
    const read = await store.messages(opened.id);
    expect(read.map((message) => message.role)).toEqual(["user", "assistant"]);
    expect(read[0]).not.toBe(first);
    await expect(store.append("aiconv_missing", "airun_1", [first])).rejects.toThrow(RangeError);
  });

  it("forgets every conversation of a principal and its messages", async () => {
    const store = new MemoryConversationStoreDriver();
    const mine = await store.open({ agent: "assistant", principalId: "usr_1" });
    const theirs = await store.open({ agent: "assistant", principalId: "usr_2" });
    await store.append(mine.id, "airun_1", [{ role: "user", content: "Hi" }]);
    expect(await store.forget("usr_1")).toBe(1);
    expect(await store.get(mine.id)).toBeUndefined();
    expect(await store.messages(mine.id)).toEqual([]);
    expect(await store.get(theirs.id)).toEqual(theirs);
    expect(await store.forget("usr_1")).toBe(0);
  });
});

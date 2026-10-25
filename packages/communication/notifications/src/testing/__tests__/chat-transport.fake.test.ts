/**
 * Stackra file contract:
 * Purpose: unit tests of `ChatTransportFake`: it stands in for the port, keeps each message once per idempotency key
 *          and answers a repeated key with the first id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0266 (decision 2); ADR 0269 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { ChatTransport } from "#contracts/index";
import type { OutboundChatMessage } from "#contracts/index";
import { ChatTransportFake } from "#testing/chat-transport.fake";

const MESSAGE: OutboundChatMessage = { channel: "C0123ABCD", text: "Order ord_1 was paid" };

describe("ChatTransportFake", () => {
  it("stands in for the port", () => {
    expect(new ChatTransportFake()).toBeInstanceOf(ChatTransport);
  });

  it("posts once per idempotency key", async () => {
    const chat = new ChatTransportFake();
    await expect(chat.post(MESSAGE, "k1")).resolves.toBe("fake_1");
    await expect(chat.post({ ...MESSAGE, text: "again" }, "k1")).resolves.toBe("fake_1");
    await expect(chat.post(MESSAGE, "k2")).resolves.toBe("fake_2");
    expect(chat.posted()).toEqual([MESSAGE, MESSAGE]);
  });
});

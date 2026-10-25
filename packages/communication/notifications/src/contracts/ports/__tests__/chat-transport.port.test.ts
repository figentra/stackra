/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ChatTransport`: a port (abstract, `Port`-branded), implemented by a driver with
 *          `Driver(ChatTransport)` that TypeScript makes implement `post`.
 * Boundary: test only; the driver is shaped like a provider driver that answers the provider's id.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 16 and 17); ADR 0305 (rule 8).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ChatTransport } from "#contracts/ports/chat-transport.port";
import type { OutboundChatMessage } from "#contracts/types/outbound-chat-message.type";

const MESSAGE: OutboundChatMessage = { channel: "C0123ABCD", text: "Order ord_1 was paid" };

class MemoryChatTransportDriver extends Driver(ChatTransport) {
  readonly messages: OutboundChatMessage[] = [];

  post(message: OutboundChatMessage, idempotencyKey: string): Promise<string> {
    this.messages.push(message);
    return Promise.resolve(`mem_${idempotencyKey}`);
  }
}

describe("ChatTransport", () => {
  it("is a port a driver implements", async () => {
    const driver = new MemoryChatTransportDriver();
    expect(driver).toBeInstanceOf(ChatTransport);
    expect(driver).toBeInstanceOf(Port);
    await expect(driver.post(MESSAGE, "k1")).resolves.toBe("mem_k1");
    expect(driver.messages).toEqual([MESSAGE]);
  });

  it("types post as message and idempotency key to the provider id", () => {
    expectTypeOf<ChatTransport["post"]>().parameters.toEqualTypeOf<[OutboundChatMessage, string]>();
    expectTypeOf<ChatTransport["post"]>().returns.toEqualTypeOf<Promise<string>>();
    // @ts-expect-error a driver must implement post
    class Empty extends Driver(ChatTransport) {}
    expect(Empty).toBeTypeOf("function");
  });
});

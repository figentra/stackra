/**
 * Stackra file contract:
 * Purpose: `ChatTransportFake`, the test double of the `ChatTransport` port: keeps every message it is handed, answers
 *          a repeated idempotency key with the first id as a provider does, and lists what was posted (`posted()`).
 * Boundary: a plain subclass of the port, so it binds in place of `ChatTransport` (`.override(ChatTransport, new
 *           ChatTransportFake())`) and `instanceof ChatTransport` holds; not a driver, so gen never offers it as a
 *           candidate. Ids are `fake_<n>`; one list per instance.
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: a fake per capability); ADR 0269 (decision 3).
 */
import { ChatTransport } from "#contracts/index";
import type { OutboundChatMessage } from "#contracts/index";

/**
 * A chat transport a test reads back.
 *
 * @example
 * const chat = new ChatTransportFake();
 * await chat.post({ channel: "C0123ABCD", text }, "k1");
 * expect(chat.posted()).toHaveLength(1);
 */
export class ChatTransportFake extends ChatTransport {
  /** Keyed by idempotency key, in post order. */
  private readonly messages = new Map<
    string,
    { readonly id: string; readonly message: OutboundChatMessage }
  >();

  /** Keeps `message` and returns its id; a repeated key returns the first id and keeps nothing. */
  post(message: OutboundChatMessage, idempotencyKey: string): Promise<string> {
    const existing = this.messages.get(idempotencyKey);
    if (existing !== undefined) return Promise.resolve(existing.id);
    const id = `fake_${this.messages.size + 1}`;
    this.messages.set(idempotencyKey, { id, message });
    return Promise.resolve(id);
  }

  /** Every message kept, in post order. */
  posted(): readonly OutboundChatMessage[] {
    return [...this.messages.values()].map((entry) => entry.message);
  }
}

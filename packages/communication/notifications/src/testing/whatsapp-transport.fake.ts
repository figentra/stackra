/**
 * Stackra file contract:
 * Purpose: `WhatsAppTransportFake`, the test double of the `WhatsAppTransport` port: keeps every message it is handed, answers a
 *          repeated idempotency key with the first id as a provider does, and lists what was sent (`sent()`).
 * Boundary: a plain subclass of the port, so it binds in place of `WhatsAppTransport` (`.override(WhatsAppTransport, new
 *           WhatsAppTransportFake())`) and `instanceof WhatsAppTransport` holds; not a driver, so gen never offers it as a
 *           candidate. Ids are `fake_<n>`; one list per instance.
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: a fake per capability); ADR 0269 (decision 3).
 */
import { WhatsAppTransport } from "#contracts/index";
import type { OutboundWhatsApp } from "#contracts/index";

/**
 * A WhatsApp transport a test reads back.
 *
 * @example
 * const whatsapp = new WhatsAppTransportFake();
 * await whatsapp.send({ to: "+966500000001", text }, "k1");
 * expect(whatsapp.sent()).toHaveLength(1);
 */
export class WhatsAppTransportFake extends WhatsAppTransport {
  /** Keyed by idempotency key, in send order. */
  private readonly messages = new Map<
    string,
    { readonly id: string; readonly message: OutboundWhatsApp }
  >();

  /** Keeps `message` and returns its id; a repeated key returns the first id and keeps nothing. */
  send(message: OutboundWhatsApp, idempotencyKey: string): Promise<string> {
    const existing = this.messages.get(idempotencyKey);
    if (existing !== undefined) return Promise.resolve(existing.id);
    const id = `fake_${this.messages.size + 1}`;
    this.messages.set(idempotencyKey, { id, message });
    return Promise.resolve(id);
  }

  /** Every message kept, in send order. */
  sent(): readonly OutboundWhatsApp[] {
    return [...this.messages.values()].map((entry) => entry.message);
  }
}

/**
 * Stackra file contract:
 * Purpose: `SmsTransportFake`, the test double of the `SmsTransport` port: keeps every message it is handed, answers a
 *          repeated idempotency key with the first id as a provider does, and lists what was sent (`sent()`).
 * Boundary: a plain subclass of the port, so it binds in place of `SmsTransport` (`.override(SmsTransport, new
 *           SmsTransportFake())`) and `instanceof SmsTransport` holds; not a driver, so gen never offers it as a
 *           candidate. Ids are `fake_<n>`; one list per instance.
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: a fake per capability); ADR 0269 (decision 3).
 */
import { SmsTransport } from "#contracts/index";
import type { OutboundSms } from "#contracts/index";

/**
 * An SMS transport a test reads back.
 *
 * @example
 * const sms = new SmsTransportFake();
 * await sms.send({ to: "+966500000001", from: "ACME", text }, "k1");
 * expect(sms.sent()).toHaveLength(1);
 */
export class SmsTransportFake extends SmsTransport {
  /** Keyed by idempotency key, in send order. */
  private readonly messages = new Map<string, { readonly id: string; readonly sms: OutboundSms }>();

  /** Keeps `sms` and returns its id; a repeated key returns the first id and keeps nothing. */
  send(sms: OutboundSms, idempotencyKey: string): Promise<string> {
    const existing = this.messages.get(idempotencyKey);
    if (existing !== undefined) return Promise.resolve(existing.id);
    const id = `fake_${this.messages.size + 1}`;
    this.messages.set(idempotencyKey, { id, sms });
    return Promise.resolve(id);
  }

  /** Every message kept, in send order. */
  sent(): readonly OutboundSms[] {
    return [...this.messages.values()].map((entry) => entry.sms);
  }
}

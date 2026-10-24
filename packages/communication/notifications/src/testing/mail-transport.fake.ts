/**
 * Stackra file contract:
 * Purpose: `MailTransportFake`, the test double of the `MailTransport` port: keeps every mail it is handed, answers a
 *          repeated idempotency key with the first id as a provider does, and lists what was sent (`sent()`).
 * Boundary: a plain subclass of the port, so it binds in place of `MailTransport` (`.override(MailTransport, new
 *           MailTransportFake())`) and `instanceof MailTransport` holds; not a driver, so gen never offers it as a
 *           candidate. Ids are `fake_<n>`; one list per instance.
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: a fake per capability); ADR 0269 (decision 3).
 */
import { MailTransport } from "#contracts/index";
import type { OutboundMail } from "#contracts/index";

/**
 * A mail transport a test reads back.
 *
 * @example
 * const transport = new MailTransportFake();
 * await transport.send(mail, "k1");
 * expect(transport.sent()).toHaveLength(1);
 */
export class MailTransportFake extends MailTransport {
  /** Keyed by idempotency key, in send order. */
  private readonly mails = new Map<string, { readonly id: string; readonly mail: OutboundMail }>();

  /** Keeps `mail` and returns its id; a repeated key returns the first id and keeps nothing. */
  send(mail: OutboundMail, idempotencyKey: string): Promise<string> {
    const existing = this.mails.get(idempotencyKey);
    if (existing !== undefined) return Promise.resolve(existing.id);
    const id = `fake_${this.mails.size + 1}`;
    this.mails.set(idempotencyKey, { id, mail });
    return Promise.resolve(id);
  }

  /** Every mail kept, in send order. */
  sent(): readonly OutboundMail[] {
    return [...this.mails.values()].map((entry) => entry.mail);
  }
}

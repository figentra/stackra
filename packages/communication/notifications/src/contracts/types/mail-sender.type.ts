/**
 * Stackra file contract:
 * Purpose: `MailSender`, what a mail provider's Connection implements (Resend, SES): send one rendered mail under an
 *          idempotency key and return the provider's id.
 * Boundary: an interface a Connection implements, not a container port: the `connection` `MailTransport` driver chooses
 *           the provider per tenant and Market (ADR 0356) and keeps the send log.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0355 (decision 1: channel role); ADR 0223.
 */
import type { OutboundMail } from "#contracts/types/outbound-mail.type";

/** A mail provider account. */
export interface MailSender {
  /** Sends `mail`; a provider with an idempotency header deduplicates on `idempotencyKey`. */
  sendMail(mail: OutboundMail, idempotencyKey: string): Promise<string>;
}

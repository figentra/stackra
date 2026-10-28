/**
 * Stackra file contract:
 * Purpose: `MailSender`, what a mail provider's Connection implements (Resend, SES): send one rendered mail under an
 *          idempotency key and return the provider's id, and name the optional mail parts it carries (`supports`).
 * Boundary: an interface a Connection implements, not a container port: the `connection` `MailTransport` driver chooses
 *           the provider per tenant and Market (ADR 0356) and keeps the send log. A sender passes every part of the
 *           mail it is given through; one that cannot carry some lists the ones it can in `supports`, and the driver
 *           refuses a mail using any other before calling it. No `supports` means every part is carried.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0355 (decision 1: channel role); ADR 0223; stackra-218 (STA-1376).
 */
import type { MailFeature } from "#contracts/types/mail-feature.type";
import type { OutboundMail } from "#contracts/types/outbound-mail.type";

/** A mail provider account. */
export interface MailSender {
  /** The optional mail parts this provider carries; absent when it carries them all. */
  readonly supports?: readonly MailFeature[];

  /** Sends `mail`; a provider with an idempotency header deduplicates on `idempotencyKey`. */
  sendMail: (mail: OutboundMail, idempotencyKey: string) => Promise<string>;
}

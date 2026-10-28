/**
 * Stackra file contract:
 * Purpose: `SmsSender`, what an SMS provider's Connection implements (Unifonic, Taqnyat, Twilio, Cequens): send one text
 *          and return the provider's id.
 * Boundary: an interface a Connection implements; the `connection` `SmsTransport` driver chooses the provider per tenant
 *           and Market (ADR 0356, OS-186) and keeps the send log. Sender id and segment rules are pack data (PUT-280).
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0223 (decision 1); OS-186.
 */
import type { OutboundSms } from "#contracts/types/outbound-sms.type";

/** An SMS provider account. */
export interface SmsSender {
  /** Sends `sms` once per `idempotencyKey` and returns the provider's id. */
  sendSms: (sms: OutboundSms, idempotencyKey: string) => Promise<string>;
}

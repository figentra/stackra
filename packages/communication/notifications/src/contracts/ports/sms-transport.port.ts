/**
 * Stackra file contract:
 * Purpose: the `SmsTransport` port: hands one rendered text message to an SMS provider and returns the provider's id
 *          for it.
 * Boundary: an abstract class that is its own token. Provider drivers (Unifonic, Taqnyat, Twilio) live with their
 *           Integration and connection, where the credentials do (ADR 0308), selected by config; this package ships
 *           the port and a test double in `./testing` only. A driver deduplicates on the idempotency key, so a retried
 *           delivery job never sends (or bills) twice.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0294 (decisions 15, 16 and 17); ADR 0305 (rule 8); ADR 0266.
 */
import { Port } from "@stackra/contracts";

import type { OutboundSms } from "#contracts/types/outbound-sms.type";

/**
 * Sends text messages.
 *
 * @example
 * export class UnifonicSmsTransportDriver extends Driver(SmsTransport) {
 *   send(sms: OutboundSms, idempotencyKey: string): Promise<string> { ... }
 * }
 */
export abstract class SmsTransport extends Port {
  /**
   * Sends `sms` once per `idempotencyKey`; a repeated key returns the first send's id and sends nothing.
   *
   * @returns the provider's id of the sent message.
   */
  abstract send(sms: OutboundSms, idempotencyKey: string): Promise<string>;
}

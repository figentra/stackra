/**
 * Stackra file contract:
 * Purpose: the `WhatsAppTransport` port: hands one WhatsApp message to a WhatsApp provider and returns the provider's id
 *          for it.
 * Boundary: an abstract class that is its own token; WhatsApp is its own channel transport, not SMS (ADR 0355 decision
 *           4). The `connection` driver chooses the provider per tenant and Market (ADR 0356). A driver sends once per
 *           idempotency key.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0355 (decision 4); ADR 0356; ADR 0305 (rule 8).
 */
import { Port } from "@stackra/contracts";

import type { OutboundWhatsApp } from "#contracts/types/outbound-whatsapp.type";

/**
 * Sends WhatsApp messages.
 *
 * @example
 * const providerId = await whatsapp.send(message, delivery.commandKey);
 */
export abstract class WhatsAppTransport extends Port {
  /**
   * Sends `message` once per `idempotencyKey`; a repeated key returns the first send's id and sends nothing.
   *
   * @returns the provider's id of the sent message.
   */
  abstract send(message: OutboundWhatsApp, idempotencyKey: string): Promise<string>;
}

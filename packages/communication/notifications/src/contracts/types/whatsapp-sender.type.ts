/**
 * Stackra file contract:
 * Purpose: `WhatsAppSender`, what a WhatsApp provider's Connection implements: send one message and return the
 *          provider's id.
 * Boundary: an interface a Connection implements; the `connection` `WhatsAppTransport` driver chooses the provider per
 *           tenant and Market (ADR 0356).
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0355 (decision 4).
 */
import type { OutboundWhatsApp } from "#contracts/types/outbound-whatsapp.type";

/** A WhatsApp provider account. */
export interface WhatsAppSender {
  /** Sends `message` once per `idempotencyKey` and returns the provider's id. */
  sendWhatsApp(message: OutboundWhatsApp, idempotencyKey: string): Promise<string>;
}

/**
 * Stackra file contract:
 * Purpose: the `WhatsAppInbound` port: reads the customer messages (text, native carts, button and list replies) out
 *          of one WhatsApp provider webhook delivery, so a host handles carts, orders and replies without knowing the
 *          provider's payload.
 * Boundary: an abstract class that is its own token. It decodes only: the signature is verified before it is called
 *           (`@stackra/webhooks`, with the provider's recipe, `META_WHATSAPP_WEBHOOK_SIGNATURE` for Meta), and the host
 *           dedupes by message id and routes. Drivers: `memory` (dev and tests) and `meta` (WhatsApp Cloud API).
 * Runtime: isomorphic
 * Governing contract: ADR 0448 (decision 1); ADR 0223; ADR 0308 (rule 15: verify before parsing); ADR 0305 (rule 8).
 */
import { Port } from "@stackra/contracts";

import type { InboundWhatsApp } from "#contracts/types/inbound-whatsapp.type";

/**
 * Reads received WhatsApp messages.
 *
 * @example
 * if (!(await verifyHmacWebhook(headers, body, META_WHATSAPP_WEBHOOK_SIGNATURE, [secret], now))) throw ...;
 * for (const message of await inbound.read(body)) await handle(message);
 */
export abstract class WhatsAppInbound extends Port {
  /**
   * The messages one verified delivery carries, in the provider's order; none for a delivery of statuses only.
   * Never throws for the delivery's content: a message the driver cannot read is left out.
   *
   * @param body - the raw body, exactly as received.
   */
  abstract read(body: string): Promise<readonly InboundWhatsApp[]>;
}

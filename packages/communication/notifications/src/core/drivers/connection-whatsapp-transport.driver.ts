/**
 * Stackra file contract:
 * Purpose: `ConnectionWhatsAppTransportDriver`, the `connection` `WhatsAppTransport`: the WhatsApp provider for the call chosen by
 *          ADR 0356 (the tenant's own Connection, else the Market's platform default), sent once per idempotency key.
 * Boundary: the provider choice is `ProviderResolver`'s; the send log is `SendLog` (keys and ids only), because these
 *           providers have no idempotency header.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2 to 4); ADR 0266; ADR 0305 (rule 8).
 */
import { Driver } from "@stackra/container";
import type { ProviderResolver } from "@stackra/integrations";

import { WhatsAppTransport } from "#contracts/ports/whatsapp-transport.port";
import type { SendLog } from "#contracts/ports/send-log.port";
import type { WhatsAppSender } from "#contracts/types/whatsapp-sender.type";
import type { OutboundWhatsApp } from "#contracts/types/outbound-whatsapp.type";
import { WHATSAPP_CONNECTIONS } from "#core/constants/whatsapp-connections.constant";

/**
 * WhatsApp messages through the chosen provider.
 *
 * @example
 * const id = await transport.send(message, delivery.commandKey);
 */
export class ConnectionWhatsAppTransportDriver extends Driver(WhatsAppTransport) {
  /** Picks the provider. */
  private readonly resolver: ProviderResolver;

  /** Remembers sent keys. */
  private readonly log: SendLog;

  /**
   * @param resolver - the integrations provider resolver.
   * @param log - the send log.
   */
  constructor(resolver: ProviderResolver, log: SendLog) {
    super();
    this.resolver = resolver;
    this.log = log;
  }

  async send(message: OutboundWhatsApp, idempotencyKey: string): Promise<string> {
    const known = await this.log.get(idempotencyKey);
    if (known !== undefined) return known;
    const sender = await this.resolver.resolve<WhatsAppSender>("whatsapp", WHATSAPP_CONNECTIONS);
    const id = await sender.sendWhatsApp(message, idempotencyKey);
    await this.log.record(idempotencyKey, id);
    return id;
  }
}

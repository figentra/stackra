/**
 * Stackra file contract:
 * Purpose: `ConnectionWhatsAppTransportDriver`, the `connection` `WhatsAppTransport`: the WhatsApp provider for the call chosen by
 *          ADR 0356 (the tenant's own Connection, else the Market's platform default), sent once per idempotency key.
 * Boundary: the provider choice is `ProviderResolver`'s, over the host's connection class per provider code
 *           (`drivers`: the vendor Connections live in the OS integrations service, R3-8, so the host subclasses this
 *           driver and passes its map); the send log is `SendLog` (keys and ids only), because these
 *           providers have no idempotency header.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2 to 4); ADR 0266; ADR 0305 (rule 8); owner decision R3-8 (STA-1281).
 */
import { Driver } from "@stackra/container";
import type { ProviderDrivers, ProviderResolver } from "@stackra/integrations";

import { WhatsAppTransport } from "#contracts/ports/whatsapp-transport.port";
import type { SendLog } from "#contracts/ports/send-log.port";
import type { WhatsAppSender } from "#contracts/types/whatsapp-sender.type";
import type { OutboundWhatsApp } from "#contracts/types/outbound-whatsapp.type";

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

  /** The host's connection class per provider code. */
  private readonly drivers: ProviderDrivers<WhatsAppSender>;

  /**
   * @param resolver - the integrations provider resolver.
   * @param log - the send log.
   * @param drivers - the host's connection class per provider code (each key its Integration's `provider`).
   */
  constructor(resolver: ProviderResolver, log: SendLog, drivers: ProviderDrivers<WhatsAppSender>) {
    super();
    this.resolver = resolver;
    this.log = log;
    this.drivers = drivers;
  }

  async send(message: OutboundWhatsApp, idempotencyKey: string): Promise<string> {
    const known = await this.log.get(idempotencyKey);
    if (known !== undefined) return known;
    const sender = await this.resolver.resolve<WhatsAppSender>("whatsapp", this.drivers);
    const id = await sender.sendWhatsApp(message, idempotencyKey);
    await this.log.record(idempotencyKey, id);
    return id;
  }
}

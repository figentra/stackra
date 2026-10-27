/**
 * Stackra file contract:
 * Purpose: `ConnectionWhatsAppTransportDriver`, the `connection` `WhatsAppTransport`: the WhatsApp provider for the call chosen by
 *          ADR 0356 (the tenant's own Connection, else the Market's platform default), sent once per idempotency key.
 * Boundary: the provider choice is `ProviderResolver`'s, over the host's connection class per provider code
 *           (`drivers`: the vendor Connections live in the OS integrations service, R3-8, so the host subclasses this
 *           abstract driver and declares its map as `drivers`; the constructor takes class tokens only, ADR 0294
 *           rule 17); the send log is `SendLog` (keys and ids only), because these
 *           providers have no idempotency header.
 *           Each outcome (sent, or failed on a provider refusal) is recorded as `DeliveryRecorded` through the
 *           optional `EventOutbox` (stackra-207); a repeated key records nothing again.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2 to 4); ADR 0266; ADR 0305 (rule 8); owner decision R3-8 (STA-1281);
 *                     stackra-207 (STA-1360).
 */
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import type { EventOutbox } from "@stackra/events/contracts";
import { ProviderRefusedError } from "@stackra/integrations";
import type { ProviderDrivers, ProviderResolver } from "@stackra/integrations";

import { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import { WhatsAppTransport } from "#contracts/ports/whatsapp-transport.port";
import type { SendLog } from "#contracts/ports/send-log.port";
import type { WhatsAppSender } from "#contracts/types/whatsapp-sender.type";
import type { OutboundWhatsApp } from "#contracts/types/outbound-whatsapp.type";
import { providerCodeOf } from "#core/functions/provider-code-of.function";
import { recordDelivery } from "#core/functions/record-delivery.function";

/**
 * WhatsApp messages through the chosen provider.
 *
 * @example
 * const id = await transport.send(message, delivery.commandKey);
 */
export abstract class ConnectionWhatsAppTransportDriver extends Driver(WhatsAppTransport) {
  /** The host's connection class per provider code (each key its Integration's `provider`), declared by its subclass. */
  protected abstract readonly drivers: ProviderDrivers<WhatsAppSender>;

  /** Picks the provider. */
  private readonly resolver: ProviderResolver;

  /** Remembers sent keys. */
  private readonly log: SendLog;

  /** Where delivery outcomes are recorded; none records nothing. */
  private readonly outbox: EventOutbox | undefined;

  /** The time of a recorded outcome; the system time when absent. */
  private readonly clock: Clock | undefined;

  /**
   * @param resolver - the integrations provider resolver.
   * @param log - the send log.
   * @param outbox - the service's event outbox, which receives one `DeliveryRecorded` per outcome; none records nothing.
   * @param clock - the clock that stamps an outcome; the system time when absent.
   */
  constructor(resolver: ProviderResolver, log: SendLog, outbox?: EventOutbox, clock?: Clock) {
    super();
    this.resolver = resolver;
    this.log = log;
    this.outbox = outbox;
    this.clock = clock;
  }

  /** Sends `message` through the resolved connection once per `idempotencyKey`; a repeated key returns the first id. */
  async send(message: OutboundWhatsApp, idempotencyKey: string): Promise<string> {
    const known = await this.log.get(idempotencyKey);
    if (known !== undefined) return known;
    const sender = await this.resolver.resolve<WhatsAppSender>("whatsapp", this.drivers);
    const delivery = {
      deliveryId: idempotencyKey,
      channel: NotificationChannel.WhatsApp,
      provider: providerCodeOf(this.drivers, sender),
    };
    let id: string;
    try {
      id = await sender.sendWhatsApp(message, idempotencyKey);
    } catch (error) {
      // A refusal is final; an outage is retried, so it records nothing.
      if (error instanceof ProviderRefusedError)
        await recordDelivery(this.outbox, this.clock, { ...delivery, status: "failed" });
      throw error;
    }
    await this.log.record(idempotencyKey, id);
    await recordDelivery(this.outbox, this.clock, { ...delivery, status: "sent" });
    return id;
  }
}

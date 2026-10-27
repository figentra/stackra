/**
 * Stackra file contract:
 * Purpose: `ConnectionMailTransportDriver`, the `connection` `MailTransport`: the mail provider for the call chosen by
 *          ADR 0356 (the tenant's own Connection, else the Market's platform default), sent once per idempotency key.
 * Boundary: the provider choice is `ProviderResolver`'s, over the host's connection class per provider code
 *           (`drivers`: the vendor Connections live in the OS integrations service, R3-8, so the host subclasses this
 *           abstract driver and declares its map as `drivers`; the constructor takes class tokens only, ADR 0294
 *           rule 17); the send log is `SendLog` (keys and ids only). A provider that
 *           deduplicates itself (Resend) is still logged, so every provider behaves the same on a retry.
 *           Each outcome (sent, or failed on a provider refusal) is recorded as `DeliveryRecorded` through the
 *           optional `EventOutbox` (stackra-207); a repeated key records nothing again. The whole mail (attachments,
 *           cc, bcc, reply address, headers) goes to the sender; when the sender lists `supports` and the mail uses a
 *           part outside it, the send is refused with `MailFeatureUnsupportedError` (recorded `failed`) before the
 *           provider is called. A header that could inject another is refused as a `TypeError` (stackra-218).
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2 to 4); ADR 0266; ADR 0305 (rule 8); owner decision R3-8 (STA-1281);
 *                     stackra-207 (STA-1360); stackra-218 (STA-1376).
 */
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import type { EventOutbox } from "@stackra/events/contracts";
import { ProviderRefusedError } from "@stackra/integrations";
import type { ProviderDrivers, ProviderResolver } from "@stackra/integrations";

import { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import { MailTransport } from "#contracts/ports/mail-transport.port";
import type { SendLog } from "#contracts/ports/send-log.port";
import type { MailSender } from "#contracts/types/mail-sender.type";
import type { OutboundMail } from "#contracts/types/outbound-mail.type";
import { MailFeatureUnsupportedError } from "#core/errors/mail-feature-unsupported.error";
import { assertMailHeaders } from "#core/functions/assert-mail-headers.function";
import { mailFeatures } from "#core/functions/mail-features.function";
import { providerCodeOf } from "#core/functions/provider-code-of.function";
import { recordDelivery } from "#core/functions/record-delivery.function";

/**
 * Mail through the chosen provider.
 *
 * @example
 * const id = await transport.send(mail, delivery.commandKey);
 */
export abstract class ConnectionMailTransportDriver extends Driver(MailTransport) {
  /** The host's connection class per provider code (each key its Integration's `provider`), declared by its subclass. */
  protected abstract readonly drivers: ProviderDrivers<MailSender>;

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

  /**
   * Sends `mail` through the resolved connection once per `idempotencyKey`; a repeated key returns the first id.
   *
   * @throws TypeError when a header name or value could inject another header.
   * @throws MailFeatureUnsupportedError when the provider does not carry a part the mail uses.
   */
  async send(mail: OutboundMail, idempotencyKey: string): Promise<string> {
    const known = await this.log.get(idempotencyKey);
    if (known !== undefined) return known;
    assertMailHeaders(mail);
    const sender = await this.resolver.resolve<MailSender>("mail", this.drivers);
    const delivery = {
      deliveryId: idempotencyKey,
      channel: NotificationChannel.Mail,
      provider: providerCodeOf(this.drivers, sender),
    };
    const supports = sender.supports;
    const missing =
      supports === undefined ? [] : mailFeatures(mail).filter((part) => !supports.includes(part));
    if (missing.length > 0) {
      await recordDelivery(this.outbox, this.clock, { ...delivery, status: "failed" });
      throw MailFeatureUnsupportedError.create({ provider: delivery.provider, features: missing });
    }
    let id: string;
    try {
      id = await sender.sendMail(mail, idempotencyKey);
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

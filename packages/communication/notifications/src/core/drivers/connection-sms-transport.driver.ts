/**
 * Stackra file contract:
 * Purpose: `ConnectionSmsTransportDriver`, the `connection` `SmsTransport`: the SMS provider (OS-186) for the call chosen by
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

import { SmsTransport } from "#contracts/ports/sms-transport.port";
import type { SendLog } from "#contracts/ports/send-log.port";
import type { SmsSender } from "#contracts/types/sms-sender.type";
import type { OutboundSms } from "#contracts/types/outbound-sms.type";

/**
 * Text messages through the chosen provider.
 *
 * @example
 * const id = await transport.send(sms, delivery.commandKey);
 */
export class ConnectionSmsTransportDriver extends Driver(SmsTransport) {
  /** Picks the provider. */
  private readonly resolver: ProviderResolver;

  /** Remembers sent keys. */
  private readonly log: SendLog;

  /** The host's connection class per provider code. */
  private readonly drivers: ProviderDrivers<SmsSender>;

  /**
   * @param resolver - the integrations provider resolver.
   * @param log - the send log.
   * @param drivers - the host's connection class per provider code (each key its Integration's `provider`).
   */
  constructor(resolver: ProviderResolver, log: SendLog, drivers: ProviderDrivers<SmsSender>) {
    super();
    this.resolver = resolver;
    this.log = log;
    this.drivers = drivers;
  }

  async send(sms: OutboundSms, idempotencyKey: string): Promise<string> {
    const known = await this.log.get(idempotencyKey);
    if (known !== undefined) return known;
    const sender = await this.resolver.resolve<SmsSender>("sms", this.drivers);
    const id = await sender.sendSms(sms, idempotencyKey);
    await this.log.record(idempotencyKey, id);
    return id;
  }
}

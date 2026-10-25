/**
 * Stackra file contract:
 * Purpose: `ConnectionSmsTransportDriver`, the `connection` `SmsTransport`: the SMS provider (OS-186) for the call chosen by
 *          ADR 0356 (the tenant's own Connection, else the Market's platform default), sent once per idempotency key.
 * Boundary: the provider choice is `ProviderResolver`'s; the send log is `SendLog` (keys and ids only), because these
 *           providers have no idempotency header.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2 to 4); ADR 0266; ADR 0305 (rule 8).
 */
import { Driver } from "@stackra/container";
import type { ProviderResolver } from "@stackra/integrations";

import { SmsTransport } from "#contracts/ports/sms-transport.port";
import type { SendLog } from "#contracts/ports/send-log.port";
import type { SmsSender } from "#contracts/types/sms-sender.type";
import type { OutboundSms } from "#contracts/types/outbound-sms.type";
import { SMS_CONNECTIONS } from "#core/constants/sms-connections.constant";

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

  /**
   * @param resolver - the integrations provider resolver.
   * @param log - the send log.
   */
  constructor(resolver: ProviderResolver, log: SendLog) {
    super();
    this.resolver = resolver;
    this.log = log;
  }

  async send(sms: OutboundSms, idempotencyKey: string): Promise<string> {
    const known = await this.log.get(idempotencyKey);
    if (known !== undefined) return known;
    const sender = await this.resolver.resolve<SmsSender>("sms", SMS_CONNECTIONS);
    const id = await sender.sendSms(sms, idempotencyKey);
    await this.log.record(idempotencyKey, id);
    return id;
  }
}

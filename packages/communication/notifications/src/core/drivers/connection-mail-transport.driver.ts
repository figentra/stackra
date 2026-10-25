/**
 * Stackra file contract:
 * Purpose: `ConnectionMailTransportDriver`, the `connection` `MailTransport`: the mail provider for the call chosen by
 *          ADR 0356 (the tenant's own Connection, else the Market's platform default), sent once per idempotency key.
 * Boundary: the provider choice is `ProviderResolver`'s; the send log is `SendLog` (keys and ids only). A provider that
 *           deduplicates itself (Resend) is still logged, so every provider behaves the same on a retry.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2 to 4); ADR 0266; ADR 0305 (rule 8).
 */
import { Driver } from "@stackra/container";
import type { ProviderResolver } from "@stackra/integrations";

import { MailTransport } from "#contracts/ports/mail-transport.port";
import type { SendLog } from "#contracts/ports/send-log.port";
import type { MailSender } from "#contracts/types/mail-sender.type";
import type { OutboundMail } from "#contracts/types/outbound-mail.type";
import { MAIL_CONNECTIONS } from "#core/constants/mail-connections.constant";

/**
 * Mail through the chosen provider.
 *
 * @example
 * const id = await transport.send(mail, delivery.commandKey);
 */
export class ConnectionMailTransportDriver extends Driver(MailTransport) {
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

  async send(mail: OutboundMail, idempotencyKey: string): Promise<string> {
    const known = await this.log.get(idempotencyKey);
    if (known !== undefined) return known;
    const sender = await this.resolver.resolve<MailSender>("mail", MAIL_CONNECTIONS);
    const id = await sender.sendMail(mail, idempotencyKey);
    await this.log.record(idempotencyKey, id);
    return id;
  }
}

/**
 * Stackra file contract:
 * Purpose: `TaqnyatConnection`, one Taqnyat account and the Taqnyat `SmsSender`: one text per call to the number without
 *          its plus, under the message's sender name.
 * Boundary: every call goes through `this.api`. No idempotency header: the send log of the `connection` transport keeps
 *           retries from sending twice.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0308 (rules 2 and 13); ADR 0356 (decision 2).
 */
import { Secret } from "@stackra/config";
import { ConnectedAccount, Connection } from "@stackra/integrations";

import type { OutboundSms } from "#contracts/types/outbound-sms.type";
import type { SmsSender } from "#contracts/types/sms-sender.type";
import type { TaqnyatIntegration } from "#core/providers/taqnyat/taqnyat.integration";

/**
 * A Taqnyat account.
 *
 * @example
 * const id = await taqnyat.sendSms(sms, delivery.commandKey);
 */
export class TaqnyatConnection extends Connection<TaqnyatIntegration> implements SmsSender {
  /** The account's token. */
  @Secret("TAQNYAT_TENANT_API_TOKEN")
  apiToken!: string;

  async check(): Promise<ConnectedAccount> {
    await this.api.get("/account/balance");
    return ConnectedAccount.create({ id: this.id });
  }

  async sendSms(sms: OutboundSms): Promise<string> {
    const sent = await this.api.post<{ readonly messageId: number | string }>("/v1/messages", {
      recipients: [sms.to.slice(1)],
      body: sms.text,
      sender: sms.from,
    });
    return String(sent.messageId);
  }
}

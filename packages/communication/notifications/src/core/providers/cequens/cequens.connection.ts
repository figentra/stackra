/**
 * Stackra file contract:
 * Purpose: `CequensConnection`, one Cequens account and the Cequens `SmsSender`: one text per call to the number without
 *          its plus, under the message's sender name.
 * Boundary: every call goes through `this.api`. Cequens answers with a `replyCode` (0 is success) beside the HTTP
 *           status; a non-zero one is raised as `ProviderRefusedError`. No idempotency header: the send log of the
 *           `connection` transport keeps retries from sending twice.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2 and 13); ADR 0356 (decision 2).
 */
import { Secret } from "@stackra/config";
import { ConnectedAccount, Connection, ProviderRefusedError } from "@stackra/integrations";

import type { OutboundSms } from "#contracts/types/outbound-sms.type";
import type { SmsSender } from "#contracts/types/sms-sender.type";
import type { CequensIntegration } from "#core/providers/cequens/cequens.integration";

/** Cequens' answer to a send. */
interface CequensAnswer {
  readonly replyCode: number;
  readonly data?: { readonly SentSMSIDs?: readonly { readonly SMSId: string }[] };
}

/**
 * A Cequens account.
 *
 * @example
 * const id = await cequens.sendSms(sms, delivery.commandKey);
 */
export class CequensConnection extends Connection<CequensIntegration> implements SmsSender {
  /** The account's token. */
  @Secret("CEQUENS_TENANT_API_TOKEN")
  apiToken!: string;

  async check(): Promise<ConnectedAccount> {
    await this.api.get("/account/api/v1/balance");
    return ConnectedAccount.create({ id: this.id });
  }

  async sendSms(sms: OutboundSms): Promise<string> {
    const answer = await this.api.post<CequensAnswer>("/sms/v1/messages", {
      senderName: sms.from,
      messageType: "text",
      messageText: sms.text,
      recipients: sms.to.slice(1),
    });
    const id = answer.data?.SentSMSIDs?.[0]?.SMSId;
    if (answer.replyCode !== 0 || id === undefined)
      throw ProviderRefusedError.create({
        provider: "cequens",
        status: 200,
        code: String(answer.replyCode),
      });
    return id;
  }
}

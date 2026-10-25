/**
 * Stackra file contract:
 * Purpose: `UnifonicConnection`, one Unifonic application and the Unifonic `SmsSender`: one text per call to the
 *          number without its plus, under the message's sender id.
 * Boundary: every call goes through `this.api` as a form. Unifonic answers HTTP 200 with `success: false` for a refusal,
 *           which is raised as a `ProviderRefusedError` with Unifonic's error code. No idempotency header: the send log
 *           of the `connection` transport keeps retries from sending twice.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0308 (rules 2 and 13); ADR 0356 (decision 2).
 */
import { Secret } from "@stackra/config";
import { ConnectedAccount, Connection, ProviderRefusedError } from "@stackra/integrations";

import type { OutboundSms } from "#contracts/types/outbound-sms.type";
import type { SmsSender } from "#contracts/types/sms-sender.type";
import type { UnifonicIntegration } from "#core/providers/unifonic/unifonic.integration";

/** Unifonic's answer envelope. */
interface UnifonicAnswer<T> {
  readonly success: boolean | string;
  readonly errorCode?: string;
  readonly data?: T;
}

/**
 * A Unifonic application.
 *
 * @example
 * const id = await unifonic.sendSms(sms, delivery.commandKey);
 */
export class UnifonicConnection extends Connection<UnifonicIntegration> implements SmsSender {
  /** The application's AppSid. */
  @Secret("UNIFONIC_APP_SID")
  appSid!: string;

  async check(): Promise<ConnectedAccount> {
    await this.call("/Account/GetBalance", {});
    return ConnectedAccount.create({ id: this.id });
  }

  async sendSms(sms: OutboundSms): Promise<string> {
    const data = await this.call<{ readonly MessageID: number | string }>("/SMS/messages", {
      SenderID: sms.from,
      Recipient: sms.to.slice(1),
      Body: sms.text,
    });
    return String(data.MessageID);
  }

  /**
   * One form call with the AppSid, unwrapped.
   *
   * @throws ProviderRefusedError when Unifonic answers `success: false`.
   */
  private async call<T>(path: string, form: Readonly<Record<string, string>>): Promise<T> {
    const answer = await this.api.post<UnifonicAnswer<T>>(
      path,
      { AppSid: this.appSid, responseType: "JSON", ...form },
      { form: true },
    );
    if (answer.success !== true && answer.success !== "true")
      throw ProviderRefusedError.create({
        provider: "unifonic",
        status: 200,
        ...(answer.errorCode === undefined ? {} : { code: answer.errorCode }),
      });
    return answer.data as T;
  }
}

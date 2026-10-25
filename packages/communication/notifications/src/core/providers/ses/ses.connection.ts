/**
 * Stackra file contract:
 * Purpose: `SesConnection`, one SES identity in one region and the SES `MailSender`: SendEmail (API v2) with the HTML
 *          and text parts, signed with SigV4.
 * Boundary: every call goes through `this.api` with the signed headers. SES has no idempotency header, so the
 *           `connection` transport's send log keeps a retry from sending twice. The access key pair is the
 *           connection's; the secret key is never logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2, 8 and 13); ADR 0356 (decision 2).
 */
import { Secret } from "@stackra/config";
import { ConnectedAccount, Connection } from "@stackra/integrations";

import type { MailSender } from "#contracts/types/mail-sender.type";
import type { OutboundMail } from "#contracts/types/outbound-mail.type";
import { signAwsV4 } from "#core/functions/sign-aws-v4.function";
import type { SesIntegration } from "#core/providers/ses/ses.integration";

/**
 * An SES account in one region.
 *
 * @example
 * const id = await ses.sendMail(mail, delivery.commandKey);
 */
export class SesConnection extends Connection<SesIntegration> implements MailSender {
  /** The AWS region (`me-central-1`). */
  region!: string;

  /** The access key id. */
  accessKeyId!: string;

  /** The secret access key. */
  @Secret("SES_SECRET_ACCESS_KEY")
  secretAccessKey!: string;

  async check(): Promise<ConnectedAccount> {
    await this.api.get("/v2/email/account", {
      headers: await this.signed("GET", "/v2/email/account"),
    });
    return ConnectedAccount.create({ id: `${this.accessKeyId}@${this.region}` });
  }

  async sendMail(mail: OutboundMail): Promise<string> {
    const body = {
      FromEmailAddress: mail.from,
      Destination: { ToAddresses: [mail.to] },
      Content: {
        Simple: {
          Subject: { Data: mail.subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: mail.html, Charset: "UTF-8" },
            Text: { Data: mail.text, Charset: "UTF-8" },
          },
        },
      },
    };
    const path = "/v2/email/outbound-emails";
    const sent = await this.api.post<{ readonly MessageId: string }>(path, body, {
      headers: await this.signed("POST", path, body),
    });
    return sent.MessageId;
  }

  /** The SigV4 headers of one call. */
  private signed(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Readonly<Record<string, string>>> {
    return signAwsV4({
      method,
      url: new URL(`https://email.${this.region}.amazonaws.com${path}`),
      body,
      region: this.region,
      service: "ses",
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
      // SigV4 signs the wall-clock time and AWS refuses a skew over five minutes, so this reads the host clock.
      now: new Date(),
    });
  }
}

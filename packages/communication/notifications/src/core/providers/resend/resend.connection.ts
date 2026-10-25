/**
 * Stackra file contract:
 * Purpose: `ResendConnection`, one Resend account and the Resend `MailSender`: one rendered mail per call, deduplicated
 *          by Resend on the idempotency key.
 * Boundary: every call goes through `this.api`. The sender is the mail's `from`; the account must have verified its
 *           domain (SPF, DKIM, DMARC, ADR 0035).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2 and 13); ADR 0035; ADR 0356 (decision 2).
 */
import { Secret } from "@stackra/config";
import { ConnectedAccount, Connection } from "@stackra/integrations";

import type { MailSender } from "#contracts/types/mail-sender.type";
import type { OutboundMail } from "#contracts/types/outbound-mail.type";
import type { ResendIntegration } from "#core/providers/resend/resend.integration";

/**
 * A Resend account.
 *
 * @example
 * const id = await resend.sendMail(mail, delivery.commandKey);
 */
export class ResendConnection extends Connection<ResendIntegration> implements MailSender {
  /** The account's API key. */
  @Secret("RESEND_TENANT_API_KEY")
  apiKey!: string;

  async check(): Promise<ConnectedAccount> {
    const domains = await this.api.get<{ readonly data: readonly { readonly name: string }[] }>(
      "/domains",
    );
    return ConnectedAccount.create({ id: domains.data[0]?.name ?? this.id });
  }

  async sendMail(mail: OutboundMail, idempotencyKey: string): Promise<string> {
    const sent = await this.api.post<{ readonly id: string }>(
      "/emails",
      { from: mail.from, to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text },
      { idempotencyKey },
    );
    return sent.id;
  }
}

/**
 * Stackra file contract:
 * Purpose: `MetaWhatsAppConnection`, one WhatsApp Business phone number and the Cloud API `WhatsAppSender`: an approved
 *          template with body parameters, or free text inside the customer service window.
 * Boundary: every call goes through `this.api`. The Cloud API has no idempotency header: the `connection` transport's
 *           send log keeps a retry from sending twice. The number is sent without its plus, as the API expects.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0355 (decision 4); ADR 0308 (rules 2 and 13); ADR 0356 (decision 2).
 */
import { Secret } from "@stackra/config";
import { ConnectedAccount, Connection } from "@stackra/integrations";

import type { OutboundWhatsApp } from "#contracts/types/outbound-whatsapp.type";
import type { WhatsAppSender } from "#contracts/types/whatsapp-sender.type";
import type { MetaWhatsAppIntegration } from "#core/providers/meta-whatsapp/meta-whatsapp.integration";

/**
 * A WhatsApp Business number.
 *
 * @example
 * const id = await whatsapp.sendWhatsApp({ to, template: { name, language: "ar", parameters } }, key);
 */
export class MetaWhatsAppConnection
  extends Connection<MetaWhatsAppIntegration>
  implements WhatsAppSender
{
  /** The phone number's id in the Cloud API. */
  phoneNumberId!: string;

  /** The token of the business that owns the number. */
  @Secret("META_WHATSAPP_TENANT_ACCESS_TOKEN")
  accessToken!: string;

  async check(): Promise<ConnectedAccount> {
    const number = await this.api.get<{
      readonly id: string;
      readonly display_phone_number?: string;
    }>(`/${this.phoneNumberId}`, { query: { fields: "display_phone_number" } });
    return ConnectedAccount.create({ id: number.display_phone_number ?? number.id });
  }

  async sendWhatsApp(message: OutboundWhatsApp): Promise<string> {
    const content =
      "template" in message
        ? {
            type: "template",
            template: {
              name: message.template.name,
              language: { code: message.template.language },
              components:
                message.template.parameters.length === 0
                  ? []
                  : [
                      {
                        type: "body",
                        parameters: message.template.parameters.map((text) => ({
                          type: "text",
                          text,
                        })),
                      },
                    ],
            },
          }
        : { type: "text", text: { body: message.text } };
    const sent = await this.api.post<{ readonly messages: readonly { readonly id: string }[] }>(
      `/${this.phoneNumberId}/messages`,
      { messaging_product: "whatsapp", to: message.to.slice(1), ...content },
    );
    return sent.messages[0]?.id ?? "";
  }
}

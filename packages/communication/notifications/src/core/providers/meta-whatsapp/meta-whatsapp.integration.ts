/**
 * Stackra file contract:
 * Purpose: `MetaWhatsAppIntegration`, the WhatsApp Cloud API (Meta's Graph API) as the WhatsApp provider: a Bearer system
 *          user token at graph.facebook.com, the API version pinned in the base URL.
 * Boundary: description only. The phone number id and token are a connection's: Figentra's shared number per region or
 *           a tenant's own (OS-188 is brand-kit data). Meta's other roles (shop, catalogue feed, tracking) belong to
 *           the same provider; see the spec's open item on one Meta Integration (ADR 0355 decisions 1 and 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1: the WhatsApp Cloud API); ADR 0355 (decision 4); ADR 0308 (rules 1 and 4).
 */
import { Secret } from "@stackra/config";
import {
  AuthType,
  ConnectionLevel,
  Integration,
  IntegrationCategory,
  IntegrationRole,
} from "@stackra/integrations";

/**
 * The WhatsApp Cloud API.
 *
 * @example
 * const whatsapp = await store.find(MetaWhatsAppConnection);
 */
export class MetaWhatsAppIntegration extends Integration({
  provider: "meta-whatsapp",
  category: IntegrationCategory.Messaging,
  roles: [IntegrationRole.Channel, IntegrationRole.Webhooks],
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {accessToken}" },
  baseUrl: "https://graph.facebook.com/v21.0",
  health: { every: "6h", failAfter: 3 },
  listing: { docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api" },
}) {
  /** The platform's system user token, for the shared number. */
  @Secret("META_WHATSAPP_ACCESS_TOKEN")
  accessToken!: string;
}

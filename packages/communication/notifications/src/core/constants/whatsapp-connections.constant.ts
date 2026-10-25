/**
 * Stackra file contract:
 * Purpose: `WHATSAPP_CONNECTIONS`, the connection class of every WhatsApp provider this package drives, by provider
 *          code.
 * Boundary: mechanism only; which number and provider serve is data. Each key equals its Integration's `provider`.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0355 (decision 4).
 */
import type { ProviderDrivers } from "@stackra/integrations";

import type { WhatsAppSender } from "#contracts/types/whatsapp-sender.type";
import { MetaWhatsAppConnection } from "#core/providers/meta-whatsapp/meta-whatsapp.connection";

/** Provider code to connection class. */
export const WHATSAPP_CONNECTIONS: ProviderDrivers<WhatsAppSender> = {
  "meta-whatsapp": MetaWhatsAppConnection,
};

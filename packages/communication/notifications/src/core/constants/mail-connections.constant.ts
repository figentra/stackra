/**
 * Stackra file contract:
 * Purpose: `MAIL_CONNECTIONS`, the connection class of every mail provider this package drives, by provider code.
 * Boundary: mechanism only: which provider a Market or tenant uses is `ProviderDefaults` data and the tenant's
 *           Connections. Each key equals its Integration's `provider`.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0086 (decision 2).
 */
import type { ProviderDrivers } from "@stackra/integrations";

import type { MailSender } from "#contracts/types/mail-sender.type";
import { ResendConnection } from "#core/providers/resend/resend.connection";
import { SesConnection } from "#core/providers/ses/ses.connection";

/** Provider code to connection class. */
export const MAIL_CONNECTIONS: ProviderDrivers<MailSender> = {
  resend: ResendConnection,
  ses: SesConnection,
};

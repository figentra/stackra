/**
 * Stackra file contract:
 * Purpose: `SMS_CONNECTIONS`, the connection class of every SMS provider this package drives, by provider code.
 * Boundary: mechanism only: which provider a Market uses is `ProviderDefaults` data (OS-186). Each key equals its
 *           Integration's `provider`.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0223 (decision 1); OS-186.
 */
import type { ProviderDrivers } from "@stackra/integrations";

import type { SmsSender } from "#contracts/types/sms-sender.type";
import { CequensConnection } from "#core/providers/cequens/cequens.connection";
import { TaqnyatConnection } from "#core/providers/taqnyat/taqnyat.connection";
import { TwilioConnection } from "#core/providers/twilio/twilio.connection";
import { UnifonicConnection } from "#core/providers/unifonic/unifonic.connection";

/** Provider code to connection class. */
export const SMS_CONNECTIONS: ProviderDrivers<SmsSender> = {
  cequens: CequensConnection,
  taqnyat: TaqnyatConnection,
  twilio: TwilioConnection,
  unifonic: UnifonicConnection,
};

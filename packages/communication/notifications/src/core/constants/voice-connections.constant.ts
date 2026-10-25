/**
 * Stackra file contract:
 * Purpose: `VOICE_CONNECTIONS`, the connection class of every telephony provider this package drives, by provider code,
 *          for `ProviderResolver.resolve("voice", VOICE_CONNECTIONS)`.
 * Boundary: mechanism only; the provider per Market is `ProviderDefaults` data. Each key equals its Integration's
 *           `provider`.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0223 (decision 1: voice through Twilio); PUT-216.
 */
import type { ProviderDrivers } from "@stackra/integrations";
import type { VoiceGateway } from "@stackra/integrations/contracts";

import { TwilioConnection } from "#core/providers/twilio/twilio.connection";

/** Provider code to connection class. */
export const VOICE_CONNECTIONS: ProviderDrivers<VoiceGateway> = { twilio: TwilioConnection };

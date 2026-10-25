/**
 * Stackra file contract:
 * Purpose: `TwilioIntegration`, Twilio as one provider with two channels: SMS (Programmable Messaging) and voice
 *          (Programmable Voice), with HTTP Basic on the account SID and auth token at api.twilio.com.
 * Boundary: description only; one provider is one Integration whatever its channels (ADR 0355 decision 1). The account
 *           is a connection's; the platform's own is the Integration's secrets. Webhooks are verified by
 *           `@stackra/webhooks` with Twilio's request signature.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1: voice through Twilio); ADR 0308 (rules 1 and 4); ADR 0355; ADR 0356.
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
 * Twilio.
 *
 * @example
 * const twilio = await store.find(TwilioConnection);
 */
export class TwilioIntegration extends Integration({
  provider: "twilio",
  category: IntegrationCategory.Telephony,
  roles: [IntegrationRole.Channel, IntegrationRole.Webhooks],
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.Basic, username: "{accountSid}", password: "{authToken}" },
  baseUrl: "https://api.twilio.com/2010-04-01",
  health: { every: "6h", failAfter: 3 },
}) {
  /** The platform account's SID. */
  @Secret("TWILIO_ACCOUNT_SID")
  accountSid!: string;

  /** The platform account's auth token. */
  @Secret("TWILIO_AUTH_TOKEN")
  authToken!: string;
}

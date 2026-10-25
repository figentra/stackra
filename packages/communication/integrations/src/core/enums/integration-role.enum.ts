/**
 * Stackra file contract:
 * Purpose: `IntegrationRole`, the five roles a provider's one Integration may play, declared on it so the app market
 *          listing can show them: a driver behind a port, a channel behind a notifications transport, a surface that
 *          shows our tools, a connector that syncs records or starts workflows, and a webhooks source.
 * Boundary: an `Enum.of` value plus the type of the same name. A provider is one Integration whatever its roles (ADR
 *           0355 decision 1); a role never makes a second Integration or a second webhook route.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 1); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The roles.
 *
 * @example
 * Integration({ provider: "slack", roles: [IntegrationRole.Channel, IntegrationRole.Surface, IntegrationRole.Connector], ... });
 */
export const IntegrationRole = Enum.of({
  /** A capability we own calls it through a port (send, charge, store, clear an e-invoice). */
  Driver: "driver",
  /** A driver behind one notifications transport (mail, sms, whatsapp, push, in-app, chat, voice). */
  Channel: "channel",
  /** Its host shows our tools, commands or cards (ADR 0348). */
  Surface: "surface",
  /** It holds records we sync or starts our workflows (ADR 0218 decision 3). */
  Connector: "connector",
  /** It sends us events, on the same Integration. */
  Webhooks: "webhooks",
});

/** One of the codes above. */
export type IntegrationRole = Enum.Value<typeof IntegrationRole>;

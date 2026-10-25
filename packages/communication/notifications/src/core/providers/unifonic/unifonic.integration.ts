/**
 * Stackra file contract:
 * Purpose: `UnifonicIntegration`, Unifonic as an SMS provider (el.cloud.unifonic.com, the REST messages API), whose
 *          credential, the AppSid, travels in the form body.
 * Boundary: description only; `auth` is `none` because the AppSid is a body field the connection sends. Which Markets
 *           offer Unifonic is market-pack data (OS-186).
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1: Unifonic); ADR 0308 (rules 1 and 8); ADR 0356.
 */
import {
  AuthType,
  ConnectionLevel,
  Integration,
  IntegrationCategory,
  IntegrationRole,
} from "@stackra/integrations";

/**
 * Unifonic.
 *
 * @example
 * const unifonic = await store.find(UnifonicConnection);
 */
export class UnifonicIntegration extends Integration({
  provider: "unifonic",
  category: IntegrationCategory.Messaging,
  roles: [IntegrationRole.Channel],
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.None },
  baseUrl: "https://el.cloud.unifonic.com/rest",
  health: { every: "6h", failAfter: 3 },
}) {}

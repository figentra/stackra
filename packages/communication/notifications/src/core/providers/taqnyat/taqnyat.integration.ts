/**
 * Stackra file contract:
 * Purpose: `TaqnyatIntegration`, Taqnyat as an SMS provider: a Bearer token at api.taqnyat.sa.
 * Boundary: description only. Which Markets offer Taqnyat is market-pack data (OS-186).
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1: Taqnyat); ADR 0308 (rules 1 and 4); ADR 0356.
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
 * Taqnyat.
 *
 * @example
 * const taqnyat = await store.find(TaqnyatConnection);
 */
export class TaqnyatIntegration extends Integration({
  provider: "taqnyat",
  category: IntegrationCategory.Messaging,
  roles: [IntegrationRole.Channel],
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiToken}" },
  baseUrl: "https://api.taqnyat.sa",
  health: { every: "6h", failAfter: 3 },
}) {
  /** The platform's token, for platform-provided SMS. */
  @Secret("TAQNYAT_API_TOKEN")
  apiToken!: string;
}

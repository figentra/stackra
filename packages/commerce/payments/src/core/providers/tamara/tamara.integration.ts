/**
 * Stackra file contract:
 * Purpose: `TamaraIntegration`, the description of Tamara's live API (buy now, pay later) as a payments provider: a
 *          merchant token bearer API at api.tamara.co.
 * Boundary: description only; credentials live on `TamaraConnection`. The sandbox has its own host, so it is its own
 *           Integration (`TamaraSandboxIntegration`). Whether a Market offers Tamara is market-pack data.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1, 4 and 13); ADR 0356 (decisions 2 and 6); ADR 0357 (decision 2).
 */
import { AuthType, ConnectionLevel, Integration, IntegrationCategory } from "@stackra/integrations";

/**
 * Tamara, live.
 *
 * @example
 * const connection = await store.find(TamaraConnection);
 */
export class TamaraIntegration extends Integration({
  provider: "tamara",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiToken}" },
  baseUrl: "https://api.tamara.co",
  health: { every: "6h", failAfter: 3 },
}) {}

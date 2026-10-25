/**
 * Stackra file contract:
 * Purpose: `TabbyIntegration`, the description of Tabby (buy now, pay later) as a payments provider: a secret-key
 *          bearer API at api.tabby.ai.
 * Boundary: description only; credentials live on `TabbyConnection`. Live and test share the host and differ by key.
 *           Whether a Market offers Tabby is market-pack data.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1, 4 and 13); ADR 0356 (decision 2); ADR 0357 (decision 2).
 */
import { AuthType, ConnectionLevel, Integration, IntegrationCategory } from "@stackra/integrations";

/**
 * Tabby.
 *
 * @example
 * const connection = await store.find(TabbyConnection);
 */
export class TabbyIntegration extends Integration({
  provider: "tabby",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {secretKey}" },
  baseUrl: "https://api.tabby.ai",
  health: { every: "6h", failAfter: 3 },
}) {}

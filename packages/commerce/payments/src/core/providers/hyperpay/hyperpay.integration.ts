/**
 * Stackra file contract:
 * Purpose: `HyperpayIntegration`, the description of HyperPay's live OPPWA API (eu-prod.oppwa.com) as a payments
 *          provider: an access-token bearer API.
 * Boundary: description only; credentials live on `HyperpayConnection`. The test host is its own Integration
 *           (`HyperpaySandboxIntegration`); which one a Market or a sandbox uses is data.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1, 4 and 13); ADR 0356 (decisions 2 and 6); ADR 0357 (decision 2).
 */
import { AuthType, ConnectionLevel, Integration, IntegrationCategory } from "@stackra/integrations";

/**
 * HyperPay, live.
 *
 * @example
 * const connection = await store.find(HyperpayConnection);
 */
export class HyperpayIntegration extends Integration({
  provider: "hyperpay",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {accessToken}" },
  baseUrl: "https://eu-prod.oppwa.com",
  health: { every: "6h", failAfter: 3 },
}) {}

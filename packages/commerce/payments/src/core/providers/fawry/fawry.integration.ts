/**
 * Stackra file contract:
 * Purpose: `FawryIntegration`, the description of FawryPay's live API (www.atfawry.com) as a payments provider. Fawry
 *          signs each request with a SHA-256 of its fields and the merchant's secure key instead of an auth header.
 * Boundary: description only (auth `none`: the connection signs its own requests, ADR 0308 "a provider outside the
 *           six"); credentials live on `FawryConnection`. The staging host is its own Integration
 *           (`FawrySandboxIntegration`).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1 and 13); ADR 0356 (decisions 2 and 6); ADR 0357 (decision 2).
 */
import { AuthType, ConnectionLevel, Integration, IntegrationCategory } from "@stackra/integrations";

/**
 * FawryPay, live.
 *
 * @example
 * const connection = await store.find(FawryConnection);
 */
export class FawryIntegration extends Integration({
  provider: "fawry",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.None },
  baseUrl: "https://www.atfawry.com",
  health: { every: "6h", failAfter: 3 },
}) {}

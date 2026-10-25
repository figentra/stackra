/**
 * Stackra file contract:
 * Purpose: `FawrySandboxIntegration`, FawryPay's staging host (atfawry.fawrystaging.com) as its own Integration, so a
 *          sandbox tenant's test-mode gateway never reaches the live host.
 * Boundary: description only; the same options as `FawryIntegration` but the base URL and provider code.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 11); ADR 0308 (rule 1).
 */
import { AuthType, ConnectionLevel, Integration, IntegrationCategory } from "@stackra/integrations";

/**
 * FawryPay, staging.
 *
 * @example
 * const connection = await store.find(FawrySandboxConnection);
 */
export class FawrySandboxIntegration extends Integration({
  provider: "fawry-sandbox",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.None },
  baseUrl: "https://atfawry.fawrystaging.com",
  health: { every: "6h", failAfter: 3 },
}) {}

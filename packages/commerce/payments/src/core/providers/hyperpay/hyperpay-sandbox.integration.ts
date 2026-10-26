/**
 * Stackra file contract:
 * Purpose: `HyperpaySandboxIntegration`, HyperPay's test host (eu-test.oppwa.com) as its own Integration, so a
 *          sandbox tenant's test-mode gateway never reaches the live host.
 * Boundary: description only; the same options as `HyperpayIntegration` but the base URL and provider code.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 11); ADR 0308 (rule 1).
 */
import { AuthType, ConnectionLevel, Integration, IntegrationCategory } from "@stackra/integrations";

/**
 * HyperPay, test.
 *
 * @example
 * const connection = await store.find(HyperpaySandboxConnection);
 */
export class HyperpaySandboxIntegration extends Integration({
  provider: "hyperpay-sandbox",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {accessToken}" },
  requestBody: "form",
  baseUrl: "https://eu-test.oppwa.com",
  health: { every: "6h", failAfter: 3 },
}) {}

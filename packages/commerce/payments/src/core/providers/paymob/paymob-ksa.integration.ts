/**
 * Stackra file contract:
 * Purpose: `PaymobKsaIntegration`, Paymob's host for Saudi Arabia (ksa.paymob.com) as its own Integration: the same Intention
 *          API and transaction operations as `PaymobIntegration`, authenticated with `Token <secret key>`.
 * Boundary: description only; the same options as `PaymobIntegration` but the base URL and provider code. Which host a
 *           Market uses is market-pack data (`paymob-ksa`), never a branch in the driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1, 4 and 13); ADR 0356 (decision 2); ADR 0357 (decision 2); spec task T012.
 */
import { AuthType, ConnectionLevel, Integration, IntegrationCategory } from "@stackra/integrations";

/**
 * Paymob, Saudi Arabia.
 *
 * @example
 * const connection = await store.find(PaymobKsaConnection);
 */
export class PaymobKsaIntegration extends Integration({
  provider: "paymob-ksa",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Token {secretKey}" },
  baseUrl: "https://ksa.paymob.com",
  health: { every: "6h", failAfter: 3 },
}) {}

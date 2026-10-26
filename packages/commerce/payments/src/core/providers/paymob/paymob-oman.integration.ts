/**
 * Stackra file contract:
 * Purpose: `PaymobOmanIntegration`, Paymob's host for Oman (oman.paymob.com) as its own Integration: the same Intention
 *          API and transaction operations as `PaymobIntegration`, authenticated with `Token <secret key>`.
 * Boundary: description only; the same options as `PaymobIntegration` but the base URL and provider code. Which host a
 *           Market uses is market-pack data (`paymob-oman`), never a branch in the driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1, 4 and 13); ADR 0356 (decision 2); ADR 0357 (decision 2); spec task T012.
 */
import { AuthType, ConnectionLevel, Integration, IntegrationCategory } from "@stackra/integrations";

/**
 * Paymob, Oman.
 *
 * @example
 * const connection = await store.find(PaymobOmanConnection);
 */
export class PaymobOmanIntegration extends Integration({
  provider: "paymob-oman",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Token {secretKey}" },
  baseUrl: "https://oman.paymob.com",
  health: { every: "6h", failAfter: 3 },
}) {}

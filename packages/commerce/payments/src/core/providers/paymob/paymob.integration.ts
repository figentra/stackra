/**
 * Stackra file contract:
 * Purpose: `PaymobIntegration`, the description of Paymob's accept.paymob.com API as a payments provider: the
 *          Intention API and the transaction operations, authenticated with `Token <secret key>`.
 * Boundary: description only; credentials live on `PaymobConnection`. Live and test share the host and differ by
 *           key. Paymob's regional hosts (KSA, UAE, Oman) are their own Integrations; which one a Market uses is data.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1, 4 and 13); ADR 0356 (decision 2); ADR 0357 (decision 2); ADR 0358 (d3).
 */
import { AuthType, ConnectionLevel, Integration, IntegrationCategory } from "@stackra/integrations";

/**
 * Paymob.
 *
 * @example
 * const connection = await store.find(PaymobConnection);
 */
export class PaymobIntegration extends Integration({
  provider: "paymob",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Token {secretKey}" },
  baseUrl: "https://accept.paymob.com",
  health: { every: "6h", failAfter: 3 },
}) {}

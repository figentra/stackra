/**
 * Stackra file contract:
 * Purpose: `CheckoutIntegration`, the description of Checkout.com's live API as a payments provider: a secret-key
 *          bearer API at api.checkout.com that deduplicates retried POSTs on `Cko-Idempotency-Key`.
 * Boundary: description only; credentials live on `CheckoutConnection`. The sandbox has its own host, so it is its own
 *           Integration (`CheckoutSandboxIntegration`); which one a Market or a sandbox uses is data.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1, 4 and 13); ADR 0356 (decisions 2 and 6); ADR 0357 (decision 2).
 */
import { AuthType, ConnectionLevel, Integration, IntegrationCategory } from "@stackra/integrations";

/**
 * Checkout.com, live.
 *
 * @example
 * const connection = await store.find(CheckoutConnection);
 */
export class CheckoutIntegration extends Integration({
  provider: "checkout",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {secretKey}" },
  baseUrl: "https://api.checkout.com",
  retry: { idempotencyHeader: "Cko-Idempotency-Key" },
  health: { every: "6h", failAfter: 3 },
}) {}

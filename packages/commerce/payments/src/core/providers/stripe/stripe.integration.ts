/**
 * Stackra file contract:
 * Purpose: `StripeIntegration`, the description of Stripe as a payments provider: a secret-key bearer API at
 *          api.stripe.com that deduplicates retried POSTs on `Idempotency-Key`.
 * Boundary: description only; credentials live on `StripeConnection` (a tenant's own account, or the platform's
 *           account per Market). Live and test mode share the host and differ by key, so one Integration serves both.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1, 4 and 13); ADR 0356 (decision 2); ADR 0357 (decision 2); ADR 0358 (d3).
 */
import { AuthType, ConnectionLevel, Integration, IntegrationCategory } from "@stackra/integrations";

/**
 * Stripe, Stripe Connect and Stripe Terminal.
 *
 * @example
 * const connection = await store.find(StripeConnection);
 */
export class StripeIntegration extends Integration({
  provider: "stripe",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {secretKey}" },
  baseUrl: "https://api.stripe.com",
  retry: { idempotencyHeader: "Idempotency-Key" },
  health: { every: "6h", failAfter: 3 },
}) {}

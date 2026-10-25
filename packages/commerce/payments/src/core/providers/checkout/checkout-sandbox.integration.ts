/**
 * Stackra file contract:
 * Purpose: `CheckoutSandboxIntegration`, Checkout.com's sandbox host (api.sandbox.checkout.com) as its own
 *          Integration, so a sandbox tenant's test-mode gateway never reaches the live host.
 * Boundary: description only; the same options as `CheckoutIntegration` but the base URL and provider code.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 11: test-mode gateways in a sandbox); ADR 0308 (rule 1).
 */
import { AuthType, ConnectionLevel, Integration, IntegrationCategory } from "@stackra/integrations";

/**
 * Checkout.com, sandbox.
 *
 * @example
 * const connection = await store.find(CheckoutSandboxConnection);
 */
export class CheckoutSandboxIntegration extends Integration({
  provider: "checkout-sandbox",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {secretKey}" },
  baseUrl: "https://api.sandbox.checkout.com",
  retry: { idempotencyHeader: "Cko-Idempotency-Key" },
  health: { every: "6h", failAfter: 3 },
}) {}

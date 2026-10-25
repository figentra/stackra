/**
 * Stackra file contract:
 * Purpose: `ResendIntegration`, Resend as a mail provider: a Bearer API key, api.resend.com, Resend's idempotency
 *          header, and the platform's own key for tenants on platform-provided mail.
 * Boundary: description only; a tenant's own key is on `ResendConnection` (bring your own, ADR 0356 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1 and 4); ADR 0086 (decision 2: Resend); ADR 0356; ADR 0355 (decision 1).
 */
import { Secret } from "@stackra/config";
import {
  AuthType,
  ConnectionLevel,
  Integration,
  IntegrationCategory,
  IntegrationRole,
  RateLimitScope,
} from "@stackra/integrations";

/**
 * Resend.
 *
 * @example
 * const resend = await store.find(ResendConnection);
 */
export class ResendIntegration extends Integration({
  provider: "resend",
  category: IntegrationCategory.Email,
  roles: [IntegrationRole.Channel],
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiKey}" },
  baseUrl: "https://api.resend.com",
  rateLimits: [{ requests: 10, per: "1s", by: RateLimitScope.Credential }],
  retry: { idempotencyHeader: "Idempotency-Key" },
  health: { every: "6h", failAfter: 3 },
  listing: { docsUrl: "https://resend.com/docs" },
}) {
  /** The platform's key, for platform-provided mail. */
  @Secret("RESEND_API_KEY")
  apiKey!: string;
}

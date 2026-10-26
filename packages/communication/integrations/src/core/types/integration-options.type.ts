/**
 * Stackra file contract:
 * Purpose: `IntegrationOptions`, what `Integration({ ... })` takes: the static description of one provider, the same
 *          for every scope and user: who may hold a connection, how a call authenticates, where the API is, its rate
 *          limits and retries, the health schedule, webhook verification and the listing.
 * Boundary: a type only; the options are checked when the class is declared and kept in the kind registry. The key,
 *           labels, logo, permissions, webhook path, egress allowlist and scope fingerprint are derived by gen and
 *           locked in the manifest (ADR 0308 rule 19), never options.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1, 6, 9, 10, 13 to 15); ADR 0305 (rule 2: a kind with options is called).
 */
import type { ConnectionLevel } from "#core/enums/connection-level.enum";
import type { ConnectorKind } from "#core/enums/connector-kind.enum";
import type { IntegrationCategory } from "#core/enums/integration-category.enum";
import type { IntegrationRole } from "#core/enums/integration-role.enum";
import type { AuthOptions } from "#core/types/auth-options.type";
import type { HealthCheck } from "#core/types/health-check.type";
import type { IntegrationListing } from "#core/types/integration-listing.type";
import type { IntegrationWebhooks } from "#core/types/integration-webhooks.type";
import type { RateLimit } from "#core/types/rate-limit.type";
import type { RetryPolicy } from "#core/types/retry-policy.type";

/**
 * The options of `Integration({ ... })`.
 *
 * @example
 * Integration({
 *   provider: "resend",
 *   category: IntegrationCategory.Email,
 *   levels: [ConnectionLevel.Scope],
 *   auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiKey}" },
 *   baseUrl: "https://api.resend.com",
 * });
 */
export interface IntegrationOptions {
  /** The provider's code, lowercase words joined by `-` or `_` (`resend`, `google-calendar`). */
  readonly provider: string;

  /** The marketplace shelf. */
  readonly category: IntegrationCategory;

  /** The roles the provider plays (ADR 0355 decision 1), shown on the listing; none when left out. */
  readonly roles?: readonly IntegrationRole[];

  /** The commerce connector kinds its Connection implements; only with the connector role. */
  readonly connectors?: readonly ConnectorKind[];

  /** Where a connection may sit, in lookup order; empty for a platform-only integration with no connection. */
  readonly levels: readonly ConnectionLevel[];

  /** How a call authenticates. */
  readonly auth: AuthOptions;

  /**
   * The HTTPS origin and base path the managed client joins paths to; also its egress allowlist. A `{field}`
   * placeholder in the host (`https://{host}`) is filled from the credential set, for a provider run per region.
   */
  readonly baseUrl?: string;

  /** The provider's documented rate limits. */
  readonly rateLimits?: readonly RateLimit[];

  /** How a failed call is retried. */
  readonly retry?: RetryPolicy;

  /**
   * How the managed client encodes a request body: JSON when left out, a form (`application/x-www-form-urlencoded`)
   * for a provider whose API takes only forms (Stripe, OPPWA). A call's own `form` option wins over it.
   */
  readonly requestBody?: "json" | "form";

  /** The scheduled health check of each connection. */
  readonly health?: HealthCheck;

  /** How the provider's webhooks are verified and routed. */
  readonly webhooks?: IntegrationWebhooks;

  /** The marketplace listing. */
  readonly listing?: IntegrationListing;

  /** Whether one owner may hold several connections; false when left out, so a new one replaces the old. */
  readonly multiple?: boolean;
}

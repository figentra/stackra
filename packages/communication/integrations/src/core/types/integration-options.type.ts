/**
 * Stackra file contract:
 * Purpose: `IntegrationOptions`, what `Integration({ ... })` takes: the static description of one provider, the same
 *          for every scope and user: who may hold a connection, how a call authenticates, where the API is, its rate
 *          limits and retries, how long one attempt may take, its circuit breaker and concurrency bulkhead (STA-1467),
 *          the headers every call carries, the health schedule, webhook verification and the listing.
 * Boundary: a type only; the options are checked when the class is declared and kept in the kind registry. The key,
 *           labels, logo, permissions, webhook path, egress allowlist and scope fingerprint are derived by gen and
 *           locked in the manifest (ADR 0308 rule 19), never options.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1, 6, 9, 10, 13 to 15); ADR 0305 (rule 2: a kind with options is called);
 *                     STA-793 (`headers`); owner D10 2026-10-28 (stackra-223: `retry` is the contracts `RetryPolicy`);
 *                     STA-1467 (`timeout`, `circuitBreaker`, `concurrency`).
 */
import type { Duration, RetryPolicy } from "@stackra/contracts";

import type { ConnectionLevel } from "#core/enums/connection-level.enum";
import type { ConnectorKind } from "#core/enums/connector-kind.enum";
import type { RateLimitScope } from "#core/enums/rate-limit-scope.enum";
import type { IntegrationCategory } from "#core/enums/integration-category.enum";
import type { IntegrationRole } from "#core/enums/integration-role.enum";
import type { AuthOptions } from "#core/types/auth-options.type";
import type { HealthCheck } from "#core/types/health-check.type";
import type { IntegrationListing } from "#core/types/integration-listing.type";
import type { IntegrationWebhooks } from "#core/types/integration-webhooks.type";
import type { RateLimit } from "#core/types/rate-limit.type";

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

  /**
   * The Integration's key, written once when stored data names it (`connectors.stripe`, `<snake>.<snake>`); gen derives
   * `<module>.<snake(class)>` when left out (STA-1739). Connection rows and OAuth apps are stored under it, so it never
   * changes once data exists.
   */
  readonly key?: string;

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

  /**
   * Headers every call carries besides the credentials, by lowercase name, each value with its `{field}` placeholders
   * (Google Ads' `developer-token: "{developerToken}"`). A call's own headers win, and the credentials win over both.
   */
  readonly headers?: Readonly<Record<string, string>>;

  /** The provider's documented rate limits. */
  readonly rateLimits?: readonly RateLimit[];

  /**
   * How the managed client retries a call the provider did not answer, timed out, rate limited or failed with a 5xx:
   * the shared `RetryPolicy` (3 attempts, `base` 200 ms doubling, `max` 30 s when left out, as before stackra-223; a
   * `Retry-After` answer wins, and `max` also bounds a wait for a full rate-limit bucket), plus the header the provider
   * deduplicates on. The failures it retries are fixed by ADR 0308, so it takes no `retryOn`. A `POST` or `PATCH` retries only when the call passes an idempotency key and that header is
   * named, so a retried call never acts twice.
   */
  readonly retry?: Partial<Omit<RetryPolicy, "retryOn">> & { readonly idempotencyHeader?: string };

  /**
   * How long one attempt may take, from sending it until its answer is read; an attempt past it is aborted and counts
   * as no answer (retried as above, `reason: "timeout"` once the retries are spent). 30 seconds when left out.
   */
  readonly timeout?: Duration;

  /**
   * The circuit breaker the runtime keeps per Integration and origin, in each instance: `failureThreshold` attempts in
   * a row that get no answer, time out, or fail with 408 or a 5xx open it, and for `cooldown` every call is refused
   * at once (`ProviderUnavailableError` with `reason: "circuit_open"` and the wait), without being sent; then one
   * trial call goes, and its outcome closes or reopens it. A 429 or a 4xx counts as an answer, and an answer counts
   * only once its body arrived. 5 failures and 30 seconds when left out; `false` turns it off.
   *
   * `by` says whose calls share a circuit. `RateLimitScope.Integration` (the default): every connection to the origin,
   * since an outage of the provider is everyone's, and one tenant's failing calls then open it for every tenant on
   * the instance until the cooldown. `RateLimitScope.Credential`: one circuit per connection (and one for the
   * platform's own credentials) on each origin, for a provider whose failures follow the account (a tenant's own
   * server, a per-account shard), so one tenant never sheds another's calls.
   */
  readonly circuitBreaker?:
    | false
    | {
        readonly failureThreshold?: number;
        readonly cooldown?: Duration;
        readonly by?: RateLimitScope;
      };

  /**
   * The bulkhead the runtime keeps per Integration and origin, in each instance: at most `limit` attempts in flight
   * at once, `queue` more waiting at most `maxWait` (none and unbounded when left out), any other refused at once
   * (`ProviderUnavailableError` with `reason: "bulkhead_full"`). None when left out: a slow provider is bounded by
   * `timeout` and the circuit breaker alone.
   */
  readonly concurrency?: {
    readonly limit: number;
    readonly queue?: number;
    readonly maxWait?: Duration;
  };

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

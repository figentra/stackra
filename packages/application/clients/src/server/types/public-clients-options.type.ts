/**
 * Stackra file contract:
 * Purpose: `PublicClientsOptions`, what `createPublicClients` takes: the gateway's base URL and area, the pinned API
 *          version, the request's locale and market, the facts forwarded from the visitor's request, and the retry
 *          policy.
 * Boundary: a type only. Public clients are anonymous: there is no session or token option.
 * Runtime: isomorphic
 * Governing contract: ADR 0082 (API areas); ADR 0118 (`Stackra-Version`); ADR 0237 (generated gateway); owner D10
 *                     2026-10-28 (stackra-223: one `RetryPolicy`).
 */
import type { ApiArea, RetryPolicy } from "@stackra/contracts";
import type { Locale } from "@stackra/i18n";

/** How to build one request's public clients. */
export interface PublicClientsOptions {
  /** The gateway origin (`https://api.acme.example`). */
  readonly baseUrl: string;

  /** The API area; only `ApiArea.Public` takes anonymous callers. */
  readonly area: ApiArea;

  /** The dated API version sent as `Stackra-Version` on every call. */
  readonly version?: string;

  /** The request's locale, sent as `Accept-Language`. */
  readonly locale?: Locale;

  /** The site's market key, sent as `Stackra-Market`. */
  readonly market?: string;

  /** Headers forwarded from the visitor's request (`forwardedFacts(request, ...)`). */
  readonly forward?: Readonly<Record<string, string>> | Promise<Readonly<Record<string, string>>>;

  /**
   * Retries of a call that is safe to repeat, as the transport's `retry` takes them; none when absent. `retryOn`
   * (was `on` before stackra-223) is `RetryOn.Retryable` when left out.
   */
  readonly retry?: RetryPolicy;
}

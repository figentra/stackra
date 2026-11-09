/**
 * Stackra file contract:
 * Purpose: `IntegrationApi`, the managed client an Integration (`resend.api`) and a Connection (`connection.api`)
 *          expose: typed JSON calls to the provider by path, and `send` for an answer read raw at any status.
 * Boundary: a type only. Its safety is what the client enforces: the authentication, the egress allowlist (the
 *           Integration's `baseUrl`), the rate limits, the retries and a typed refusal for every provider outcome
 *           (`ProviderRefusedError` for a 4xx, `ProviderUnavailableError` once retries are spent). `send` answers
 *           every status instead, and throws only when nothing came back.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13: `connection.api` is a public read-only member); STA-2607.
 */
import type { RawRequest } from "#core/types/raw-request.type";
import type { RawResponse } from "#core/types/raw-response.type";
import type { RequestOptions } from "#core/types/request-options.type";

/**
 * A provider's API through the managed client; `T` is the provider's answer as the caller's schema types it.
 *
 * @example
 * const domains = await connection.api.get<ResendDomainList>("/domains");
 */
export interface IntegrationApi {
  /** `GET path`; retried. */
  get: <T>(path: string, options?: RequestOptions) => Promise<T>;

  /** `DELETE path`; retried. */
  delete: <T>(path: string, options?: RequestOptions) => Promise<T>;

  /** `POST path` with a JSON body; retried only with an idempotency key. */
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

  /** `PUT path` with a JSON body; retried. */
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

  /** `PATCH path` with a JSON body; retried only with an idempotency key. */
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

  /**
   * `request`, answered as it came (status, headers, text) for every status; a transient status is retried as for the
   * typed calls, and the last answer is returned once retries are spent. Throws `ProviderUnavailableError` only when
   * nothing came back or a rate limit stays full.
   */
  send: (request: RawRequest) => Promise<RawResponse>;
}

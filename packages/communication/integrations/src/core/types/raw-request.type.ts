/**
 * Stackra file contract:
 * Purpose: `RawRequest`, one call `IntegrationApi.send` makes when the caller needs the provider's answer as it came,
 *          whatever its status: a fiscal authority's validation result on a 400, an access point's 409.
 * Boundary: a type only. `path` is joined under the Integration's `baseUrl` like every managed call, so the call never
 *           leaves its origin; the client adds the auth, the declared headers and the idempotency header.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13); STA-2607.
 */
import type { HttpMethod } from "@stackra/contracts";

import type { RawBody } from "#core/types/raw-body.type";

/**
 * A request sent through the managed client and answered raw.
 *
 * @example
 * const answer = await connection.api.send({ method: HttpMethod.Post, path: "/invoices/clearance/single", body });
 */
export interface RawRequest {
  /** The HTTP method. */
  readonly method: HttpMethod;

  /** The path under the Integration's base URL. */
  readonly path: string;

  /** Extra headers; the client's own headers (authentication, idempotency) win. */
  readonly headers?: Readonly<Record<string, string>>;

  /** The body, sent exactly as given with its own media type; none when left out. */
  readonly body?: RawBody;

  /** Sent in the Integration's idempotency header, which also lets a `POST` or `PATCH` retry. */
  readonly idempotencyKey?: string;

  /** Aborts the call and its retries. */
  readonly signal?: AbortSignal;
}

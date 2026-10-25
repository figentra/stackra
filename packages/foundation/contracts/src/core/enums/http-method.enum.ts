/**
 * Stackra file contract:
 * Purpose: the HTTP methods an endpoint may use, for an `endpoint: { method, path }` override and the manifest's
 *          `endpoint.method`.
 * Boundary: an `Enum.of` value plus the type of the same name. The codes are HTTP's own upper-case tokens, a
 *           tool-owned value that keeps the tool's spelling instead of snake_case; they are the manifest's values.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 21: the endpoint convention), AGENTS.md http-conventions (methods by
 *                     idempotency).
 */
import { Enum } from "#core/bases/enum.base";

/** A query is `Get`; an action is `Post`, `Put`, `Patch` or `Delete`. */
export const HttpMethod = Enum.of({
  /** Safe and idempotent, no body; queries only. */
  Get: "GET",
  /** Not idempotent; creates. */
  Post: "POST",
  /** An idempotent state transition. */
  Put: "PUT",
  /** A partial update. */
  Patch: "PATCH",
  /** Idempotent removal. */
  Delete: "DELETE",
});

/** One of the codes above. */
export type HttpMethod = Enum.Value<typeof HttpMethod>;

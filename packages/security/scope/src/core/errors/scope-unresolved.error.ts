/**
 * Stackra file contract:
 * Purpose: `ScopeUnresolvedError`, the refusal of a request no step of the resolver chain found a scope for
 *          (`scope_unresolved`): no granted header, no claim, no other step's answer and no visible root.
 * Boundary: raised by `ChainScopeResolverDriver` before any action runs; kind `Forbidden` (HTTP 403), not retryable.
 *           It carries no details, so it never tells the caller which scopes exist.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 7); ADR 0140 (envelope and kinds); final review R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: only a grant, a header inside one, or a claim changes the answer.
 *
 * @example
 * throw ScopeUnresolvedError.create();
 */
export class ScopeUnresolvedError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {}

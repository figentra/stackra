/**
 * Stackra file contract:
 * Purpose: `SCOPE_PATH_HEADER`, the one client header that asks for a scope: the generated client writes the active
 *          scope's path into it, and the transport hands its value to the resolver chain as `ScopeRequest.header`.
 * Boundary: a constant only. The value is untrusted input: `HeaderScopeResolverDriver` accepts it only inside a path the
 *           caller holds a grant for and drops it otherwise. No other client header names a scope.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 7); `.agents/rules/tenancy.md` (point 4).
 */

/**
 * The scope header's name.
 *
 * @example
 * const request: ScopeRequest = { actor, header: headers.get(SCOPE_PATH_HEADER) ?? undefined };
 */
export const SCOPE_PATH_HEADER = "X-Scope-Path";

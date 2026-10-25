/**
 * Stackra file contract:
 * Purpose: `SCOPE_PATH_CLAIM`, the token claim that names the scope a token was issued for: identity's provider mapping
 *          writes it (`IDENTITY_CLAIMS.scopePath`), and the transport hands its value to the resolver chain as
 *          `ScopeRequest.claim`, which `ClaimScopeResolverDriver` reads.
 * Boundary: a constant only, the one home of the name (identity imports it). It sits beside `SCOPE_PATH_HEADER` in the
 *           `.` entry because `contracts/` holds ports, enums and types only (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 7: the token claim step); ADR 0206 (decision 2: the Stackra claims).
 */

/**
 * The scope path claim's name.
 *
 * @example
 * const claim = verifiedClaims[SCOPE_PATH_CLAIM];
 * const request: ScopeRequest = { actor, claim: typeof claim === "string" ? claim : undefined };
 */
export const SCOPE_PATH_CLAIM = "urn:stackra:scope_path";

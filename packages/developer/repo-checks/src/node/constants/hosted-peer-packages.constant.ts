/**
 * Stackra file contract:
 * Purpose: `HOSTED_PEER_PACKAGES`, the packages a library must take as a peer when its code uses their values: their
 *          classes, tokens and refusals have one identity in the host, so a second copy breaks them (a Connection base
 *          from one copy is "not loaded by a ConnectionStore" from the other).
 * Boundary: data only; `checkHostedPeers` reads it. A subpath on `exempt` (types and plain enums) carries no identity.
 * Runtime: node
 * Governing contract: ADR 0308 (integrations, one store per host); the payments 0.21.0 packaging regression (2026-11-08).
 */

/** Each package with the subpaths whose values carry no identity. */
export const HOSTED_PEER_PACKAGES: readonly {
  readonly name: string;
  readonly exempt: readonly string[];
}[] = [{ name: "@stackra/integrations", exempt: ["contracts"] }];

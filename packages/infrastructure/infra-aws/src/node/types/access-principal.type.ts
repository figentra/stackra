/**
 * Stackra file contract:
 * Purpose: `AccessPrincipal`, the Identity Center user or group an Account Access Manager entitlement grants.
 * Boundary: types only.
 * Runtime: node
 * Governing contract: ADR 0172, ADR 0524.
 */

/** The Identity Center user or group an entitlement grants. */
export type AccessPrincipal = { readonly userId: string } | { readonly groupId: string };

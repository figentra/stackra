/**
 * Stackra file contract:
 * Purpose: `IDENTITY_CLAIMS`, the names of the provider-neutral claims a Stackra token carries besides the standard
 *          OIDC ones (`email`, `name`, `picture`): the user's public id, the memberships, the scope the token was
 *          issued for and the permissions held there.
 * Boundary: names only. The provider adds the claims (on ZITADEL, the action the identity service installs maps each
 *           organisation to its scope node), so no product reads a provider's own claim. The claim step of the scope
 *           resolver chain reads `scopePath` from the verified token into `ScopeRequest.claim`; `sessionUserOf` reads
 *           the rest. Each membership is `{ scopeId, path, name, roles }`, with the `scp_` id and `ltree` path of the
 *           scope node and at least one role code.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 2 and 3); ADR 0208 (roles); ADR 0327 (decisions 3 and 7: the token claim
 *                     step).
 */

/**
 * The Stackra claim names.
 *
 * @example
 * const scopePath = verifiedClaims[IDENTITY_CLAIMS.scopePath];
 * const request: ScopeRequest = { actor, claim: typeof scopePath === "string" ? scopePath : undefined };
 */
export const IDENTITY_CLAIMS = Object.freeze({
  /** The user's `usr_` public id; the provider's own subject id never leaves the identity service. */
  userId: "urn:stackra:user_id",
  /** The memberships: `[{ scopeId: "scp_…", path: "platform.acme", name: "Acme", roles: ["admin"] }]`. */
  memberships: "urn:stackra:memberships",
  /** The `ltree` path of the scope the token was issued for (`platform.acme.shop_eu`). */
  scopePath: "urn:stackra:scope_path",
  /** The permission names the user holds in that scope (`orders.order.read`). */
  permissions: "urn:stackra:permissions",
} as const);

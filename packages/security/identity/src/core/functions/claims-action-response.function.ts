/**
 * Stackra file contract:
 * Purpose: `claimsActionResponse(claims)`, the identity service's answer to the provider's claims call
 *          (`IdpAdmin.installClaimsAction`): ZITADEL's `append_claims`, one entry per `IDENTITY_CLAIMS` name, so every
 *          token and userinfo answer carries the user id, realm, memberships, scope path and permissions.
 * Boundary: pure. The scope path is left out until a scope is chosen; every other claim is always present, so a token
 *           without the realm cannot be issued by this action. ZITADEL keeps a key as given and drops only its own
 *           reserved prefix, which no Stackra name uses. The caller verifies the call first (`verifyZitadelSignature`).
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 2 and 3); ZITADEL Actions v2 (function `preuserinfo` and
 *                     `preaccesstoken` responses); STA-2558.
 */
import { IDENTITY_CLAIMS } from "#core/constants/identity-claims.constant";
import type { StackraClaims } from "#core/types/stackra-claims.type";

/** One claim ZITADEL appends. */
interface AppendClaim {
  readonly key: string;
  readonly value: unknown;
}

/**
 * The provider's answer that adds `claims`.
 *
 * @example
 * const answer = claimsActionResponse({ userId, realm: "tenant", memberships, scopePath, permissions });
 * return Response.json(answer);
 */
export function claimsActionResponse(claims: StackraClaims): {
  readonly append_claims: readonly AppendClaim[];
} {
  return {
    append_claims: [
      { key: IDENTITY_CLAIMS.userId, value: claims.userId },
      { key: IDENTITY_CLAIMS.realm, value: claims.realm },
      { key: IDENTITY_CLAIMS.memberships, value: claims.memberships },
      ...(claims.scopePath === undefined
        ? []
        : [{ key: IDENTITY_CLAIMS.scopePath, value: claims.scopePath }]),
      { key: IDENTITY_CLAIMS.permissions, value: claims.permissions },
    ],
  };
}

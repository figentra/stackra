/**
 * Stackra file contract:
 * Purpose: `loginPolicyRejectionOf(requested, current, knownProviderIds)`, the checks a login policy passes before it
 *          reaches the identity provider: every external provider it lists is one the deployment configures, at least
 *          one way to sign in is left (a password, a passkey alone, or an allowed external provider the organisation
 *          offers), and a forced second factor comes with at least one second factor offered.
 * Boundary: pure. A list the request leaves out is the one the organisation offers now (`current`), as
 *           `IdpAdmin.setLoginPolicy` keeps it; only the providers the request names are checked against the
 *           configured ones, so a provider linked outside this call never blocks another change. Answers the first rule
 *           broken, in the order above, or `undefined`.
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (decision 1: the MFA policy); ADR 0410 (decision 4); STA-2817.
 */
import { LoginPolicyRejection } from "#contracts/enums/login-policy-rejection.enum";
import type { LoginPolicy } from "#contracts/types/login-policy.type";

/**
 * Why `requested` must not be pushed, or `undefined` when it may.
 *
 * @param requested - the policy an administrator asks for.
 * @param current - the policy the organisation applies now (`IdpAdmin.getLoginPolicy`).
 * @param knownProviderIds - the provider-side ids the deployment configures (`IdentityConfig.externalProviders`).
 * @example
 * const reason = loginPolicyRejectionOf(input, await idp.getLoginPolicy(org), Object.values(config.externalProviders));
 * if (reason !== undefined) throw LoginPolicyRejectedError.create({ reason });
 */
export function loginPolicyRejectionOf(
  requested: LoginPolicy,
  current: LoginPolicy,
  knownProviderIds: readonly string[],
): LoginPolicyRejection | undefined {
  if (requested.externalProviderIds?.some((id) => !knownProviderIds.includes(id)) === true)
    return LoginPolicyRejection.UnknownProvider;
  const providers = requested.externalProviderIds ?? current.externalProviderIds ?? [];
  const factors = requested.secondFactors ?? current.secondFactors ?? [];
  const external = requested.allowExternalIdp && providers.length > 0;
  if (!requested.allowUsernamePassword && !requested.allowPasswordless && !external)
    return LoginPolicyRejection.NoSignInMethod;
  if (requested.forceMfa && factors.length === 0) return LoginPolicyRejection.NoSecondFactor;
  return undefined;
}

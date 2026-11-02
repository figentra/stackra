/**
 * Stackra file contract:
 * Purpose: `AccountSecurityOverview`, what `AccountSecurity.overview()` answers: whether the user has a password, the
 *          second factors set up and the passkeys.
 * Boundary: a type only. The second factors are `IdpSecondFactor` codes without `u2f`, since a security key is a
 *           passkey here.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (client ports); ADR 0207 (decision 1).
 */
import type { IdpSecondFactor } from "#contracts/enums/idp-second-factor.enum";
import type { PasskeySummary } from "#contracts/types/passkey-summary.type";

/**
 * The user's sign-in methods.
 *
 * @example
 * const overview: AccountSecurityOverview = { hasPassword: true, secondFactors: ["totp"], passkeys: [] };
 */
export interface AccountSecurityOverview {
  /** True when the user can sign in with a password. */
  readonly hasPassword: boolean;

  /** The second factors set up, in the provider's order. */
  readonly secondFactors: readonly Exclude<IdpSecondFactor, typeof IdpSecondFactor.U2f>[];

  /** The passkeys on the account. */
  readonly passkeys: readonly PasskeySummary[];
}

/**
 * Stackra file contract:
 * Purpose: `LoginPolicyRejection`, why `identity.login_policy.set@1` refuses a login policy before it reaches the
 *          identity provider: it would leave no way to sign in, it forces a second factor while offering none, or it
 *          names an external provider the deployment does not configure.
 * Boundary: an `Enum.of` value plus the type of the same name, snake_case codes carried as the `reason` of
 *           `LoginPolicyRejectedError`. A code names the rule, never a provider id or a user. Its labels are
 *           `enums.login_policy_rejection` in `assets/lang/<locale>/identity.json`.
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (decision 1: the MFA policy); ADR 0231 (snake_case codes); ADR 0410 (decision 4);
 *                     STA-2817.
 */
import { Enum } from "@stackra/contracts";

/** The reasons a login policy is refused. */
export const LoginPolicyRejection = Enum.of({
  /** No method is left: no password, no passkey alone and no external provider, so nobody could sign in. */
  NoSignInMethod: "no_sign_in_method",
  /** A second factor is forced while the organisation offers none, so every user would be locked out. */
  NoSecondFactor: "no_second_factor",
  /** An external provider id is not one of the deployment's `IdentityConfig.externalProviders`. */
  UnknownProvider: "unknown_provider",
});

/** One of the codes above. */
export type LoginPolicyRejection = Enum.Value<typeof LoginPolicyRejection>;

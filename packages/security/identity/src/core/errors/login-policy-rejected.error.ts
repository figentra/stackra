/**
 * Stackra file contract:
 * Purpose: `LoginPolicyRejectedError`, a login policy `identity.login_policy.set@1` will not push to the identity
 *          provider (`login_policy_rejected`), with the rule it breaks as `reason`: no way left to sign in, a second
 *          factor forced while none is offered, or an external provider the deployment does not configure.
 * Boundary: kind `Validation`, retryable false. Raised before any provider call, so a refused policy changes nothing.
 *           The details carry the `LoginPolicyRejection` code only, never a provider id.
 * Runtime: isomorphic
 * Governing contract: ADR 0140; ADR 0207 (decision 1); ADR 0410 (decision 4); STA-2817.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

import type { LoginPolicyRejection } from "#contracts/enums/login-policy-rejection.enum";

/**
 * The refusal of a login policy that would lock people out or names an unknown provider.
 *
 * @example
 * throw LoginPolicyRejectedError.create({ reason: LoginPolicyRejection.NoSecondFactor });
 */
export class LoginPolicyRejectedError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The rule the policy breaks. */
  reason!: LoginPolicyRejection;
}

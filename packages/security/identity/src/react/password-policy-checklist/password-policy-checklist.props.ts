/**
 * Stackra file contract:
 * Purpose: `PasswordPolicyChecklistProps`, what a host hands the PasswordPolicyChecklist: the policy, the password
 *          typed so far, the id the password field points at, and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). The policy is the provider's password
 *           complexity policy as data; the words are the host's (ADR 0504 decision 4).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0207 (decision 3); ADR 0305.
 */
import type { PasswordPolicy } from "#contracts/types/password-policy.type";

/**
 * The checklist's policy, password and words.
 *
 * @example
 * <PasswordField aria-describedby="password-rules" value={password} onChange={setPassword} />
 * <PasswordPolicyChecklist id="password-rules" policy={policy} password={password} labels={labels} />
 */
export interface PasswordPolicyChecklistProps {
  /** The rules a new password must meet. */
  readonly policy: PasswordPolicy;
  /** The password typed so far. */
  readonly password: string;
  /** The root's id, for `aria-describedby` on the password input. */
  readonly id?: string | undefined;
  /** The checklist's words; the host writes them. */
  readonly labels: {
    /** The list's spoken name and the meter's label, for example "Password rules". */
    readonly label: string;
    /** The length rule, with the policy's number, for example "At least 12 characters". */
    readonly minLength: string;
    /** Shown when the policy asks for one, for example "A capital letter". */
    readonly uppercase: string;
    /** Shown when the policy asks for one, for example "A small letter". */
    readonly lowercase: string;
    /** Shown when the policy asks for one, for example "A number". */
    readonly number: string;
    /** Shown when the policy asks for one, for example "A symbol". */
    readonly symbol: string;
    /** Read with a rule the password meets, for example "Met". */
    readonly met: string;
    /** Read with a rule it does not meet yet, for example "Not yet". */
    readonly unmet: string;
  };
  /** Classes on the root. */
  readonly className?: string | undefined;
}

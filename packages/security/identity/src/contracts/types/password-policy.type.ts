/**
 * Stackra file contract:
 * Purpose: `PasswordPolicy`, the rules a new password must meet: a minimum length and the character classes it must
 *          hold, as the PasswordPolicyChecklist checks them while the user types.
 * Boundary: a type only, provider-neutral; the fields mirror the provider's password complexity policy (ZITADEL's
 *           `minLength`, `hasUppercase`, `hasLowercase`, `hasNumber`, `hasSymbol`), and the provider still checks
 *           the password on submit.
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (decision 3: at least 12 characters, no composition rules by default); ADR 0206.
 */

/**
 * The password rules.
 *
 * @example
 * const policy: PasswordPolicy = { minLength: 12, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSymbol: false };
 */
export interface PasswordPolicy {
  /** The fewest characters. */
  readonly minLength: number;

  /** At least one capital letter. */
  readonly hasUppercase: boolean;

  /** At least one small letter. */
  readonly hasLowercase: boolean;

  /** At least one digit. */
  readonly hasNumber: boolean;

  /** At least one character that is neither a letter nor a digit. */
  readonly hasSymbol: boolean;
}

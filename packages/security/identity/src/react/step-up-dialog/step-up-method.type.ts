/**
 * Stackra file contract:
 * Purpose: `StepUpMethod`, a way a person may prove it is them again in the StepUpDialog: a passkey, an authenticator
 *          code, the password or a backup code.
 * Boundary: a type only. The provider's MFA policy picks the factor on its re-authentication page (ADR 0207
 *           decision 1); the dialog names the accepted ones so the person knows what to have ready.
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (decision 1); ADR 0504.
 */

/**
 * One accepted step-up factor.
 *
 * @example
 * const methods: readonly StepUpMethod[] = ["passkey", "totp"];
 */
export type StepUpMethod = "passkey" | "totp" | "password" | "backup-code";

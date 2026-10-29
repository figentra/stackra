/**
 * Stackra file contract:
 * Purpose: `AppleSignInResult`, what a Sign in with Apple call resolves to: the credential for the server, or an
 *          `AppleSignInRefusal`.
 * Boundary: a type only, the `{ ok, data } | { ok, error }` envelope of ADR 0140. A refusal is a value the caller
 *           branches on, never a thrown error; a programming error (the library is not installed) still throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope shape); ADR 0206 (decision 8); STA-1578.
 */
import type { AppleSignInRefusal } from "#contracts/enums/apple-sign-in-refusal.enum";
import type { AppleCredential } from "#contracts/types/apple-credential.type";

/**
 * The outcome of a Sign in with Apple call.
 *
 * @example
 * const result = await apple.signIn(nonce);
 * if (!result.ok && result.error === AppleSignInRefusal.Unsupported) return session.signIn(externalSignIn("apple", identity));
 */
export type AppleSignInResult =
  | { readonly ok: true; readonly data: AppleCredential }
  | { readonly ok: false; readonly error: AppleSignInRefusal };

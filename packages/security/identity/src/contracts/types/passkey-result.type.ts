/**
 * Stackra file contract:
 * Purpose: `PasskeyResult`, what a passkey call resolves to: the credential for the provider, or a `PasskeyRefusal`.
 * Boundary: a type only, the `{ ok, data } | { ok, error }` envelope of ADR 0140. A refusal is a value the caller
 *           branches on, never a thrown error; a programming error still throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope shape); ADR 0206 (decision 8); STA-1538.
 */
import type { PasskeyRefusal } from "#contracts/enums/passkey-refusal.enum";
import type { PasskeyCredential } from "#contracts/types/passkey-credential.type";

/**
 * The outcome of a passkey registration or sign-in.
 *
 * @example
 * const result = await passkeys.authenticate(options);
 * if (!result.ok && result.error === PasskeyRefusal.NoCredential) return session.signIn();
 */
export type PasskeyResult =
  | { readonly ok: true; readonly data: PasskeyCredential }
  | { readonly ok: false; readonly error: PasskeyRefusal };

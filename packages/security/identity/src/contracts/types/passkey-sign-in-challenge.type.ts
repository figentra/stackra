/**
 * Stackra file contract:
 * Purpose: `PasskeySignInChallenge`, what starting a passkey sign-in hands back: the identity provider's session the
 *          check belongs to and the WebAuthn request options the device signs.
 * Boundary: a type only, provider-neutral. `IdpAdmin.startPasskeySignIn` produces it (on ZITADEL, a v2 session with a
 *           `webAuthN` challenge, `publicKey` unwrapped); the device passes `options` to `Passkeys.authenticate` and the
 *           session id back with the credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); W3C WebAuthn Level 3 (§ 5.5); STA-1538.
 */
import type { PasskeyRequestOptions } from "#contracts/types/passkey-request-options.type";

/** A started passkey sign-in. */
export interface PasskeySignInChallenge {
  /** The provider's session the passkey check completes. */
  readonly sessionId: string;

  /** What the device signs. */
  readonly options: PasskeyRequestOptions;
}

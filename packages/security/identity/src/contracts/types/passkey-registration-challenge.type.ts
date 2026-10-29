/**
 * Stackra file contract:
 * Purpose: `PasskeyRegistrationChallenge`, what starting a passkey registration hands back: the provider's id of the
 *          pending passkey and the WebAuthn creation options the device answers.
 * Boundary: a type only, provider-neutral. `IdpAdmin.startPasskeyRegistration` produces it (on ZITADEL,
 *           `POST /v2/users/{id}/passkeys`, `publicKey` unwrapped); the device passes `options` to `Passkeys.register`
 *           and the passkey id back with the credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); W3C WebAuthn Level 3 (§ 5.4); STA-1538.
 */
import type { PasskeyCreationOptions } from "#contracts/types/passkey-creation-options.type";

/** A started passkey registration. */
export interface PasskeyRegistrationChallenge {
  /** The provider's id of the passkey being registered. */
  readonly passkeyId: string;

  /** What the device creates. */
  readonly options: PasskeyCreationOptions;
}

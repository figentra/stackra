/**
 * Stackra file contract:
 * Purpose: `PasskeyRequestOptions`, the WebAuthn sign-in options (`PublicKeyCredentialRequestOptionsJSON`) the
 *          identity provider hands out for a passkey check: the challenge, the relying party and the allowed keys.
 * Boundary: a type only, the W3C JSON shape with base64url strings, provider-neutral. The server side (ZITADEL's
 *           session `challenges.webAuthN`, unwrapped from `publicKey`) produces it; the device only passes it on.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); W3C WebAuthn Level 3 (§ 5.5); STA-1538.
 */

/** What the provider asks the device to sign. */
export interface PasskeyRequestOptions {
  /** The base64url challenge to sign. */
  readonly challenge: string;

  /** The relying party id: the identity provider's domain (`id.acme.example`). */
  readonly rpId: string;

  /** How long the device may take, in milliseconds. */
  readonly timeout?: number;

  /** The credentials that may answer; absent lets the person pick any passkey for the site. */
  readonly allowCredentials?: readonly { readonly id: string; readonly type: "public-key" }[];

  /** Whether the device must verify the person (biometric or passcode). */
  readonly userVerification?: "discouraged" | "preferred" | "required";
}

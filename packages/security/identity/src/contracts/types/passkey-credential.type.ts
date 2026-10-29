/**
 * Stackra file contract:
 * Purpose: `PasskeyCredential`, what the device hands back from a passkey registration or sign-in, the WebAuthn
 *          `PublicKeyCredential` JSON the identity provider verifies.
 * Boundary: a type only, base64url strings; the `response` fields differ between registration (`attestationObject`)
 *           and sign-in (`authenticatorData`, `signature`, `userHandle`) and go to the provider unread.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); W3C WebAuthn Level 3 (§ 5.1); STA-1538.
 */

/** A passkey credential to send to the provider. */
export interface PasskeyCredential {
  /** The base64url credential id. */
  readonly id: string;

  /** The same id, as WebAuthn's JSON carries it twice. */
  readonly rawId: string;

  /** The credential type, always `public-key`. */
  readonly type: "public-key";

  /** `platform` (this device) or `cross-platform` (a security key or another phone), when the device says. */
  readonly authenticatorAttachment?: string;

  /** The signed response: `clientDataJSON` plus the registration or sign-in fields. */
  readonly response: Readonly<Record<string, unknown>>;
}

/**
 * Stackra file contract:
 * Purpose: `PasskeyCreationOptions`, the WebAuthn registration options (`PublicKeyCredentialCreationOptionsJSON`) the
 *          identity provider hands out for a new passkey: the challenge, the relying party, the user and the key types.
 * Boundary: a type only, the W3C JSON shape with base64url strings, provider-neutral. The server side (ZITADEL's
 *           `POST /v2/users/{id}/passkeys`, unwrapped from `publicKey`) produces it; the device only passes it on.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); W3C WebAuthn Level 3 (§ 5.4); STA-1538.
 */

/** What the provider asks the device to create. */
export interface PasskeyCreationOptions {
  /** The base64url challenge the provider signs the registration against. */
  readonly challenge: string;

  /** The relying party: its id is the identity provider's domain (`id.acme.example`). */
  readonly rp: { readonly id: string; readonly name: string };

  /** The account: its base64url user handle, its login name and its display name. */
  readonly user: { readonly id: string; readonly name: string; readonly displayName: string };

  /** The key algorithms the provider accepts, most preferred first. */
  readonly pubKeyCredParams: readonly { readonly type: "public-key"; readonly alg: number }[];

  /** How long the device may take, in milliseconds. */
  readonly timeout?: number;

  /** Credentials the account already holds, so the device refuses a second one. */
  readonly excludeCredentials?: readonly { readonly id: string; readonly type: "public-key" }[];

  /** Which authenticator the provider wants (platform, resident key, user verification). */
  readonly authenticatorSelection?: {
    readonly authenticatorAttachment?: "platform" | "cross-platform";
    readonly requireResidentKey?: boolean;
    readonly residentKey?: "discouraged" | "preferred" | "required";
    readonly userVerification?: "discouraged" | "preferred" | "required";
  };

  /** The attestation the provider wants back. */
  readonly attestation?: "none" | "indirect" | "direct" | "enterprise";
}

/**
 * Stackra file contract:
 * Purpose: `AppleIdpInputs`, what `identityStack` hands the Apple identity provider's dynamic provider: the instance
 *          domain, the provisioner's key, Apple's public ids and the `.p8` key.
 * Boundary: a type only. `jwtProfileJson` and `privateKey` arrive as Pulumi secrets; the provider never returns the
 *           Apple key in its outputs (ADR 0173).
 * Runtime: node
 * Governing contract: ADR 0171 (decision 2), ADR 0173, STA-1578.
 */

/** The dynamic provider's inputs. */
export type AppleIdpInputs = {
  /** The instance's domain (`id.acme.example`). */
  readonly domain: string;
  /** The provisioner's key JSON, `zitadel:jwtProfileJson`. */
  readonly jwtProfileJson: string;
  /** The Apple services id, the client id ZITADEL sends Apple. */
  readonly clientId: string;
  /** The Apple Developer team id. */
  readonly teamId: string;
  /** The id of the Sign in with Apple key. */
  readonly keyId: string;
  /** The `.p8` key, PEM text. */
  readonly privateKey: string;
};

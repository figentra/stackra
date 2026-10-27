/**
 * Stackra file contract:
 * Purpose: `CmsSignerSecrets`, the names of the secrets the pkijs `CmsSigner` reads: the signing certificate, its
 *          PKCS #8 private key and the intermediate certificates sent with the signature (Apple's WWDR).
 * Boundary: a type only; names, never values (ADR 0173). The values are PEM text held in the deployment's secret
 *           store (Infisical), never in git or a log.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5: `APPLE_WALLET_PASS_CERTIFICATE`, `APPLE_WALLET_PASS_KEY`); ADR 0173.
 */

/** The secret names of one signing identity. */
export interface CmsSignerSecrets {
  /** The signer's X.509 certificate, PEM (`APPLE_WALLET_PASS_CERTIFICATE`). */
  readonly certificate: string;

  /** The signer's RSA private key, PKCS #8 PEM (`APPLE_WALLET_PASS_KEY`). */
  readonly key: string;

  /** The intermediate certificates, PEM, in order (`APPLE_WALLET_WWDR_CERTIFICATE`). */
  readonly chain: readonly string[];
}

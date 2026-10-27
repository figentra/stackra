/**
 * Stackra file contract:
 * Purpose: `APPLE_WALLET_SIGNER_SECRETS`, the secret names the pkijs `CmsSigner` reads by default: the Apple Wallet
 *          pass-type certificate and key of ADR 0348 decision 5 and Apple's WWDR intermediate certificate.
 * Boundary: names only, never values (ADR 0173); a host signing for another purpose passes its own
 *           `CmsSignerSecrets`.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5); ADR 0173.
 */
import type { CmsSignerSecrets } from "#node/pass/cms-signer-secrets.type";

/** The Apple Wallet signing identity's secret names. */
export const APPLE_WALLET_SIGNER_SECRETS: CmsSignerSecrets = Object.freeze({
  certificate: "APPLE_WALLET_PASS_CERTIFICATE",
  key: "APPLE_WALLET_PASS_KEY",
  chain: Object.freeze(["APPLE_WALLET_WWDR_CERTIFICATE"]),
});

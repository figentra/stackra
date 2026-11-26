/**
 * Stackra file contract:
 * Purpose: `ImageTrust`, the one trust root a deploy image is signed and checked with: a KMS key (air-gapped, no
 *          transparency log unless a private Sigstore is named), or the keyless signer (Runway's `runway-image.yml`),
 *          the caller repository and the caller's git ref the certificate must name; and the private Sigstore files a
 *          signer or verifier may name instead of the public instance.
 * Boundary: type only; key references and file paths, never a credential.
 * Runtime: node
 * Governing contract: ADR 0174 (decision 2: Sigstore attestations, a KMS cosign key for air-gapped installs); STA-609.
 */
/** What an image is signed and verified against. */
export type ImageTrust = {
  /** A KMS key reference (`awskms://…`, `hashivault://…`); without one the signature is keyless (GitHub OIDC). */
  readonly key?: string | undefined;
  /** For keyless: the `owner/repo` whose job signs or signed. */
  readonly sourceRepository?: string | undefined;
  /** For keyless: the signer identity pattern (default `IMAGE_SUPPLY_CHAIN_SETTINGS.signerIdentity`). */
  readonly identity?: string | undefined;
  /**
   * For keyless: the caller's git ref the certificate must name (default `IMAGE_SUPPLY_CHAIN_SETTINGS.callerRef`,
   * `refs/heads/main`).
   */
  readonly callerRef?: string | undefined;
  /**
   * A Sigstore trusted root JSON file (a private Sigstore, or the public one fetched ahead for an offline verify). With a
   * KMS key it makes the verify check the transparency log against that root instead of skipping it.
   */
  readonly trustedRoot?: string | undefined;
  /**
   * Signing only: a Sigstore signing config file (a private Rekor and timestamp authority). A KMS signature without one
   * uses no transparency log (`IMAGE_SUPPLY_CHAIN_SETTINGS.kmsOffline`).
   */
  readonly signingConfig?: string | undefined;
};

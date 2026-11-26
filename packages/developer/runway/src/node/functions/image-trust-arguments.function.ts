/**
 * Stackra file contract:
 * Purpose: `imageTrustArguments(key, sourceRepository, identity)`, the cosign arguments naming the one trust root an
 *          image is signed and checked with: `--key <kms>` for an air-gapped signer, or the keyless GitHub OIDC issuer,
 *          the signer identity (Runway's `runway-image.yml`) and the caller repository the certificate must name.
 * Boundary: pure; refuses a key that is not a KMS reference (a key file is never accepted) and a keyless check with no
 *           repository to pin, before any cosign run.
 * Runtime: node
 * Governing contract: ADR 0174 (decision 2: Sigstore attestations, a KMS cosign key for air-gapped installs); STA-609.
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { IMAGE_SUPPLY_CHAIN_SETTINGS } from "#node/constants/image-supply-chain-settings.constant";

/**
 * The trust-root arguments for `cosign sign`, `attest`, `verify` and `verify-attestation`. Signing passes only the
 * key part: a keyless signature takes its identity from the job's OIDC token.
 *
 * @param key - a KMS key reference, or `undefined` for keyless.
 * @param sourceRepository - for keyless: the `owner/repo` whose job signs or signed.
 * @param identity - for keyless: the signer identity pattern.
 * @throws RunwayUnresolvedError when the key is not a KMS reference, or a keyless check names no valid repository.
 * @example
 * imageTrustArguments(undefined, "acme/app"); // ["--certificate-identity-regexp", "^https://github…", …]
 * imageTrustArguments("awskms:///alias/acme-images", undefined); // ["--key", "awskms:///alias/acme-images"]
 */
export function imageTrustArguments(
  key: string | undefined,
  sourceRepository: string | undefined,
  identity: string = IMAGE_SUPPLY_CHAIN_SETTINGS.signerIdentity,
): string[] {
  if (key !== undefined) {
    const kms =
      IMAGE_SUPPLY_CHAIN_SETTINGS.kmsSchemes.some((scheme) => key.startsWith(scheme)) &&
      !/\s/.test(key);
    if (!kms)
      throw new RunwayUnresolvedError(
        `the signing key must be a KMS reference (${IMAGE_SUPPLY_CHAIN_SETTINGS.kmsSchemes.join(", ")}), never a key file`,
      );
    return ["--key", key];
  }
  if (
    sourceRepository === undefined ||
    !IMAGE_SUPPLY_CHAIN_SETTINGS.repositoryPattern.test(sourceRepository)
  )
    throw new RunwayUnresolvedError(
      "a keyless signature is checked against the repository whose job signed it: pass owner/repo",
    );
  return [
    "--certificate-identity-regexp",
    identity,
    "--certificate-oidc-issuer",
    IMAGE_SUPPLY_CHAIN_SETTINGS.oidcIssuer,
    "--certificate-github-workflow-repository",
    sourceRepository,
  ];
}

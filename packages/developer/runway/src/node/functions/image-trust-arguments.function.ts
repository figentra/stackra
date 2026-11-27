/**
 * Stackra file contract:
 * Purpose: `imageTrustArguments(trust, use)`, the cosign arguments naming the one trust root an image is signed
 *          (`sign`) or checked (`verify`) with. A KMS key signs with the signing config given (Runway passes the offline
 *          one, no transparency log, when none is named) and verifies with the log check skipped, or against the
 *          trusted root given. Keyless verifies GitHub's OIDC issuer, the signer identity (Runway's `runway-image.yml`
 *          at a commit or release tag), the caller repository and the caller's git ref (main by default).
 * Boundary: pure; refuses a key that is not a KMS reference (a key file is never accepted), a keyless check with no
 *           repository to pin, a caller ref that is not a full branch or tag ref, and a file argument that cosign could
 *           read as a flag, before any cosign run.
 * Runtime: node
 * Governing contract: ADR 0174 (decision 2: Sigstore attestations, a KMS cosign key for air-gapped installs); ADR 0019
 *                     (decision 1: a reusable workflow is called by commit); STA-609.
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { IMAGE_SUPPLY_CHAIN_SETTINGS } from "#node/constants/image-supply-chain-settings.constant";
import type { ImageTrust } from "#node/types/image-trust.type";

/** A file argument: not empty, no whitespace, and not read as a flag. */
const FILE = /^[^\s-][^\s]*$/;

/**
 * The trust-root arguments for `cosign sign` and `attest` (`use: "sign"`) or `verify` and `verify-attestation`
 * (`use: "verify"`). A keyless signature takes its identity from the job's OIDC token, so signing keyless names only
 * the Sigstore files given.
 *
 * @param trust - the KMS key, or the keyless repository, identity and caller ref; the Sigstore files.
 * @param use - `sign` or `verify`.
 * @throws RunwayUnresolvedError when the key is not a KMS reference, a keyless check names no valid repository or
 *         caller ref, or a Sigstore file argument is not a plain path.
 * @example
 * imageTrustArguments({ sourceRepository: "acme/app" }, "verify"); // [..., "--certificate-github-workflow-ref", "refs/heads/main"]
 * imageTrustArguments({ key: "awskms:///alias/acme-images" }, "verify"); // ["--key", "awskms:///alias/acme-images", "--insecure-ignore-tlog=true"]
 */
export function imageTrustArguments(trust: ImageTrust, use: "sign" | "verify"): string[] {
  const settings = IMAGE_SUPPLY_CHAIN_SETTINGS;
  const { key, trustedRoot, signingConfig } = trust;
  for (const [flag, file] of [
    ["--trusted-root", trustedRoot],
    ["--signing-config", signingConfig],
  ] as const)
    if (file !== undefined && !FILE.test(file))
      throw new RunwayUnresolvedError(`${flag} must name a file path, not ${JSON.stringify(file)}`);
  const root = trustedRoot === undefined ? [] : ["--trusted-root", trustedRoot];

  if (key !== undefined) {
    const kms = settings.kmsSchemes.some((scheme) => key.startsWith(scheme)) && !/\s/.test(key);
    if (!kms)
      throw new RunwayUnresolvedError(
        `the signing key must be a KMS reference (${settings.kmsSchemes.join(", ")}), never a key file`,
      );
    if (use === "sign")
      return [
        "--key",
        key,
        ...(signingConfig === undefined ? [] : ["--signing-config", signingConfig]),
        ...root,
      ];
    // Air-gapped: no log entry was written unless a private Sigstore's trusted root is named.
    return ["--key", key, ...(trustedRoot === undefined ? settings.kmsOffline.verifyArgs : root)];
  }

  if (
    trust.sourceRepository === undefined ||
    !settings.repositoryPattern.test(trust.sourceRepository)
  )
    throw new RunwayUnresolvedError(
      "a keyless signature is checked against the repository whose job signed it: pass owner/repo",
    );
  const callerRef = trust.callerRef ?? settings.callerRef;
  if (!settings.callerRefPattern.test(callerRef))
    throw new RunwayUnresolvedError(
      `${callerRef} is not a caller ref: pass the full ref the signing job ran on (refs/heads/main, refs/tags/<tag>)`,
    );
  if (use === "sign")
    return [...(signingConfig === undefined ? [] : ["--signing-config", signingConfig]), ...root];
  return [
    "--certificate-identity-regexp",
    trust.identity ?? settings.signerIdentity,
    "--certificate-oidc-issuer",
    settings.oidcIssuer,
    "--certificate-github-workflow-repository",
    trust.sourceRepository,
    "--certificate-github-workflow-ref",
    callerRef,
    ...root,
  ];
}

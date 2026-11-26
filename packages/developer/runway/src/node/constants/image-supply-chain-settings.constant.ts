/**
 * Stackra file contract:
 * Purpose: `IMAGE_SUPPLY_CHAIN_SETTINGS`, the data Runway's image step runs with (`publishImage`, `verifyImage`): the
 *          `encore build docker` arguments, the Trivy gate, the syft SBOM format, the cosign attestation type, the
 *          keyless signer every verify pins (Runway's own `runway-image.yml` on GitHub's OIDC issuer), the KMS key
 *          schemes an air-gapped signer may name, and the record and SBOM file names.
 * Boundary: data only; no tool version (the workflow pins each with `mise exec <tool>@<version>`) and no credential:
 *           cosign, docker and the registry read their own login (GitHub OIDC, the job's registry login, a KMS role).
 * Runtime: node
 * Governing contract: ADR 0174 (decisions 1 and 2: syft SBOM, cosign signature and Sigstore attestations, Trivy fails
 *                     on a fixable critical finding, a KMS key for air-gapped installs); ADR 0168 (decision 2: `encore
 *                     build docker` only in deploy and release jobs); STA-609.
 */

/** How the image step builds, gates, describes, signs and checks one deploy image. */
export const IMAGE_SUPPLY_CHAIN_SETTINGS = Object.freeze({
  /**
   * `encore build docker` arguments before the base and the tag: no infra configuration is read or baked in, so one
   * image (one digest) is promoted through every environment and each reads its own at run time.
   */
  buildArgs: Object.freeze(["build", "docker", "--skip-config"]),
  /**
   * The Trivy gate on the built image, before anything is pushed: only a critical vulnerability that has a released
   * fix fails, as the lockfile scan of the release job (ADR 0174 decision 1). Quiet, so a refusal carries Trivy's
   * findings table and not its log lines.
   */
  scanArgs: Object.freeze([
    "image",
    "--scanners",
    "vuln",
    "--severity",
    "CRITICAL",
    "--ignore-unfixed",
    "--exit-code",
    "1",
    "--no-progress",
    "--quiet",
    "--skip-version-check",
  ]),
  /** The syft output format of the image SBOM. */
  sbomFormat: "cyclonedx-json",
  /** The cosign predicate type the SBOM is attested as, and verified as. */
  attestationType: "cyclonedx",
  /** The OIDC issuer of a keyless signature made in GitHub Actions. */
  oidcIssuer: "https://token.actions.githubusercontent.com",
  /**
   * The keyless signer a verify accepts: the certificate's identity is the reusable workflow that signed
   * (`job_workflow_ref`), Runway's `runway-image.yml` at any ref. The caller repository is pinned separately.
   */
  signerIdentity:
    "^https://github\\.com/stackra-inc/stackra/\\.github/workflows/runway-image\\.yml@",
  /** The cosign key references an air-gapped signer may name: KMS keys only, never a key file (ADR 0174 decision 2). */
  kmsSchemes: Object.freeze(["awskms://", "gcpkms://", "azurekms://", "hashivault://"]),
  /** An image repository: registry host (and port) and at least one lower-case path segment, no tag or digest. */
  imagePattern: /^[a-z0-9][a-z0-9.-]*(?::[0-9]+)?(?:\/[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*)+$/,
  /** An image reference by digest: an image repository, `@sha256:` and 64 hex digits. */
  referencePattern:
    /^[a-z0-9][a-z0-9.-]*(?::[0-9]+)?(?:\/[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*)+@sha256:[0-9a-f]{64}$/,
  /** A base image pinned by digest (`node:24-slim@sha256:…`). */
  basePattern: /^[^\s@]+@sha256:[0-9a-f]{64}$/,
  /** A GitHub `owner/repo`. */
  repositoryPattern: /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/,
  /** The record the step writes per image, under the output folder; `<name>` is the image's last path segment. */
  recordFile: "runway-image-<name>.json",
  /** The SBOM the step writes per image, under the output folder. */
  sbomFile: "sbom-<name>.cdx.json",
  /** The record's schema id. */
  recordSchema: "runway.image/v1",
});

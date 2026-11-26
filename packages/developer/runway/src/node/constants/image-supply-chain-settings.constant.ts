/**
 * Stackra file contract:
 * Purpose: `IMAGE_SUPPLY_CHAIN_SETTINGS`, the data Runway's image step runs with (`publishImage`, `verifyImage`): the
 *          `encore build docker` arguments, the Trivy gate, the syft SBOM format, the cosign attestation type, the
 *          keyless signer every verify pins (Runway's own `runway-image.yml` at a commit or release tag, on GitHub's
 *          OIDC issuer, called from the caller repository's main), the KMS key schemes an air-gapped signer may name,
 *          the offline transparency-log policy of a KMS signature, and the record and SBOM file names.
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
   * (`job_workflow_ref`), Runway's `runway-image.yml` called by a full commit id (ADR 0019 decision 1), a `runway-v<n>`
   * release tag or Stackra's protected main (Stackra's own local call), never another branch. The caller repository
   * and the caller's ref are pinned separately; a verifier pins a released commit exactly with its own identity.
   */
  signerIdentity:
    "^https://github\\.com/stackra-inc/stackra/\\.github/workflows/runway-image\\.yml@(?:[0-9a-f]{40}|refs/tags/runway-v[0-9]+|refs/heads/main)$",
  /**
   * The caller's git ref a keyless verify pins by default (the certificate's GitHub workflow ref: the `ref` claim of
   * the job that signed): main, the protected branch whose workflow files are reviewed. A workflow pushed to any other
   * branch can call a copy of `runway-image.yml` with the main-only check and the Trivy gate removed (an impostor
   * commit of the signer), so a signature made from another ref is refused unless the verifier names that ref.
   */
  callerRef: "refs/heads/main",
  /** A caller ref a verify may pin instead: a full branch or tag ref. */
  callerRefPattern: /^refs\/(?:heads|tags)\/[A-Za-z0-9._/-]+$/,
  /**
   * The air-gapped policy of a KMS signature (ADR 0174 decision 2) when no private Sigstore is named: no transparency
   * log and no timestamp authority. Signing passes this Sigstore signing config (`cosign signing-config create` with no
   * service writes the same), so it reaches only the KMS and the registry and no image digest or public key goes to
   * the public Rekor log; the verify skips the log check to match and needs no Sigstore trusted root.
   */
  kmsOffline: Object.freeze({
    signingConfig: Object.freeze({
      mediaType: "application/vnd.dev.sigstore.signingconfig.v0.2+json",
      rekorTlogConfig: Object.freeze({}),
      tsaConfig: Object.freeze({}),
    }),
    signingConfigFile: "cosign-signing-config.offline.json",
    verifyArgs: Object.freeze(["--insecure-ignore-tlog=true"]),
  }),
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

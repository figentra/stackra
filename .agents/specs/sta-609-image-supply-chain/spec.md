# Feature Specification: deploy images are scanned, described by an SBOM and signed

**Feature Branch**: `figentra/sta-609-image-supply-chain`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: CTO

**Linear**: STA-609

**Clarifications status**: complete

**Input**: The production-readiness audit (batch 17, item 17.1): deployed images have no SBOM, no vulnerability scan
and no signature, which procurement asks for. ADR 0174 decisions 1 and 2 require a syft SBOM and a cosign signature on
every image, Trivy failing the build on a fixable critical finding, Sigstore attestations, and a KMS cosign key for
air-gapped installs; its enforcement names "cosign verification at deploy". ADR 0168 decision 2 runs `encore build
docker` only in deploy and release jobs. On origin/main (de40b3c75) no workflow or Runway code built, scanned, signed
or verified an image: Trivy scanned only the npm lockfile and cosign signed only the npm SBOM blob.

### Sources

- `packages/developer/runway/src/node/functions/encore-deploy-tree.function.ts` (the deploy commit's tree)
- `.github/workflows/runway-npm.yml` (the Trivy and cosign pins and the keyless pattern)
- `.github/workflows/runway-cloudflare-workers.yml` (the provider workflow shape)
- ADR 0174, ADR 0168 decision 2, ADR 0287 decision 10 (public images on GHCR), ADR 0289 decision 8
- Encore 1.58.8 `encore build docker --help`

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/runway (image step, two commands, settings, error, types; `EncoreDeployTree`
  gains `dir`)
- **Public contract change**: yes, additive: `@stackra/runway` exports `RunwayImageRejectedError` and the `ImageStep`
  type from `.`; `publishImage`, `verifyImage`, `IMAGE_SUPPLY_CHAIN_SETTINGS` and the `ImagePublishRequest`,
  `ImagePublication`, `ImageVerifyRequest` and `ImageTrust` types from `./node`; `runway image:publish` (with
  `--ref`, `--signing-config`, `--trusted-root`) and `runway image:verify` (with `--ref`, `--trusted-root`);
  the reusable workflow `runway-image.yml` with its inputs and outputs. Nothing existing changes shape.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: raises it: an image is Trivy-gated before the push, and only a digest is signed, attested
  and verified. No credential is an argument or written; the keyless signer is pinned to Runway's workflow at a
  commit, `runway-v<n>` tag or Stackra's main, GitHub's issuer, the caller repository and the caller's ref (main by
  default), so a workflow on another branch of the caller cannot sign an ungated image the verify accepts; a key file
  is refused (KMS references only); a KMS signature writes nothing to the public Rekor log (no image digest or key).
- **Secrets**: none new. The registry login is the job's own (ECR over GitHub OIDC with a role ARN, or GHCR with the
  job's token); keyless signing needs no key.
- **ADR needed**: no (implements ADR 0174 decisions 1 and 2 and ADR 0168 decision 2; ADR 0174's Enforcement line is
  updated)
- **New dependencies**: none in package.json; the workflow pins Trivy 0.76.1, syft 1.57.0, cosign 3.1.4 and encore
  1.58.8 through `mise exec`
- **Deploy modes**: SaaS self-hosted (ECR) and on-prem images keyless; air-gapped signs and verifies with a KMS key and
  no Sigstore service (no transparency log or timestamp authority), or a private Sigstore named by its signing config
  and trusted root
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/runway/README.md` (command table, "The image step"),
  `packages/developer/runway/AGENTS.md`, `apps/docs/src/docs/runbooks/runway.mdx` (provider table, "Deploy images"
  with the pinned caller ref in the cosign one-liner and what an air-gapped verifier needs, what is not built yet),
  `.github/workflows/README.md`, ADR 0174 Enforcement
- **Lane**: full
- **Change risk**: R2 (a new public deploy workflow and commands; no existing path changes behaviour)

## Acceptance criteria

- **AC-001**: WHEN `publishImage` runs THE image SHALL be built by `encore build docker --skip-config --base <base>
--arch <arch> <image>:<sha>` in the deploy commit's tree (`encoreDeployTree`), with the repository's installed
  `node_modules` linked in, and the checkout SHALL be removed afterwards.
- **AC-002**: WHEN Trivy finds a critical vulnerability with a released fix THE step SHALL refuse the image
  (`RunwayImageRejectedError`, step `scan`) and push, describe and sign nothing.
- **AC-003**: WHEN a push succeeds THE step SHALL read the digest the registry answered and SHALL describe (syft CycloneDX
  JSON), sign, attest the SBOM to, and verify only `<image>@sha256:<digest>`; WHEN no digest is answered it SHALL sign
  nothing.
- **AC-004**: THE signature SHALL be keyless unless a KMS key reference is given; a keyless verify SHALL pin the
  certificate identity to Runway's `runway-image.yml` called by a full commit, a `runway-v<n>` tag or Stackra's main,
  the GitHub OIDC issuer, the caller repository and the caller's git ref (`refs/heads/main` unless the verifier names
  another full ref); a signature made by a workflow on another ref of the caller, or by `runway-image.yml` at a branch,
  SHALL be refused; a key file SHALL be refused.
- **AC-005**: THE verify (`verifyImage`, `runway image:verify`) SHALL refuse a reference that is not pinned by digest
  before cosign runs, and SHALL refuse the image when the signature or the CycloneDX attestation does not verify.
- **AC-006**: THE step SHALL refuse, before the build, a tagged, upper-case or registry-less image, a base not pinned by
  digest, a short commit, a key file, and a keyless publish with no repository to pin.
- **AC-007**: THE step SHALL write `runway-image-<name>.json` (`runway.image/v1`) naming the image, tag, digest,
  reference, source and deploy commits, base, architecture, SBOM file and signing mode, and nothing secret.
- **AC-008**: THE workflow `runway-image.yml` SHALL refuse a commit not on main, build and gen, sign in to ECR (GitHub
  OIDC role) or GHCR (job token) over stdin, run the step with pinned tools, upload the record and SBOM, and output
  `reference` and `digest`.
- **AC-009**: WHEN a KMS key signs and no signing config is named THE step SHALL sign and attest with a Sigstore
  signing config that names no transparency log or timestamp authority (removed afterwards), and a KMS verify SHALL
  skip the log check unless a trusted root is named, so signing and verifying reach only the KMS and the registry; a
  named signing config and trusted root SHALL be passed to cosign instead.
- **AC-010**: WHEN a keyless `runway image:publish` runs on another ref THE command SHALL refuse before the build
  (the job's `GITHUB_REF` differs from `--ref`, default `refs/heads/main`).

## Status history

- 2026-11-26 → Clarified (the audit's claim re-verified on origin/main de40b3c75: no image is built, scanned or signed)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built in this branch; unit tests and a real run of build, Trivy, push, syft, cosign sign,
  attest and verify on box 2)
- 2026-11-26 → Implementing (review: the keyless verify pins the caller's ref and a commit, tag or main signer; a KMS
  signature uses no transparency log; proved with publishImage and verifyImage against real cosign 3.1.4, a
  `hashivault://` transit key in a dev Vault and a local registry, with every Sigstore host unreachable)

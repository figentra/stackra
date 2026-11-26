---
"@stackra/runway": minor
---

Deploy images are scanned, described by an SBOM and signed (ADR 0174, STA-609). `runway image:publish` (`publishImage`)
builds the generated Encore app as one image with `encore build docker` from its deploy commit, refuses it before the
push when Trivy finds a critical vulnerability with a released fix, pushes it, writes a syft CycloneDX SBOM, signs and
attests the registry's digest with cosign (keyless with the job's GitHub OIDC identity, or a KMS key for an air-gapped
signer, with no transparency log unless a private Sigstore's `--signing-config` is named) and verifies both, then writes
`runway-image-<name>.json`. `runway image:verify` (`verifyImage`) is the check a deploy runs first; it refuses a tag,
pins a keyless signature to Runway's workflow at a commit, `runway-v<n>` tag or Stackra's main and to the caller's ref
(`--ref`, default `refs/heads/main`), and checks a KMS signature with no Sigstore service unless `--trusted-root` is
named. The reusable workflow `runway-image.yml` runs the step in a deploy or release job.
New exports: `RunwayImageRejectedError` and `ImageStep` from `.`; `publishImage`, `verifyImage`,
`IMAGE_SUPPLY_CHAIN_SETTINGS` and the `ImagePublishRequest`, `ImagePublication`, `ImageVerifyRequest` and `ImageTrust`
types from `./node`. `EncoreDeployTree` also answers the checkout folder (`dir`).

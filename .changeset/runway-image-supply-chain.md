---
"@stackra/runway": minor
---

Deploy images are scanned, described by an SBOM and signed (ADR 0174, STA-609). `runway image:publish` (`publishImage`)
builds the generated Encore app as one image with `encore build docker` from its deploy commit, refuses it before the
push when Trivy finds a critical vulnerability with a released fix, pushes it, writes a syft CycloneDX SBOM, signs and
attests the registry's digest with cosign (keyless with the job's GitHub OIDC identity, or a KMS key for an air-gapped
signer) and verifies both, then writes `runway-image-<name>.json`. `runway image:verify` (`verifyImage`) is the check a
deploy runs first; it refuses a tag. The reusable workflow `runway-image.yml` runs the step in a deploy or release job.
New exports: `RunwayImageRejectedError` and `ImageStep` from `.`; `publishImage`, `verifyImage`,
`IMAGE_SUPPLY_CHAIN_SETTINGS` and the `ImagePublishRequest`, `ImagePublication` and `ImageVerifyRequest` types from
`./node`. `EncoreDeployTree` also answers the checkout folder (`dir`).

# Implementation Plan: deploy images are scanned, described by an SBOM and signed

**Spec**: `.agents/specs/sta-609-image-supply-chain/spec.md` · **Linear**: STA-609 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-609-image-supply-chain/spec.md`

## Summary

`@stackra/runway` gains the image step: `publishImage` builds the generated Encore app as one image from its deploy
commit, gates it with Trivy, pushes it, reads the digest, writes a syft SBOM, signs and attests the digest with cosign
and verifies both with `verifyImage`, then writes a record. Two commands expose it (`runway image:publish`, `runway
image:verify`), and the reusable workflow `runway-image.yml` runs it in a deploy or release job.

## Technical Context

- **Language**: TypeScript (ESM), GitHub Actions YAML
- **Members**: `packages/developer/runway` (developer); `.github/workflows`
- **Testing**: vitest in `src/**/__tests__/` (a temporary git repository with the real git and a recording fake for the
  tools); actionlint and zizmor on the workflow; a real run on box 2
- **Storage**: none
- **Runtime target**: a GitHub Actions deploy or release job (ubuntu-latest, docker present)

## Constitution Check

| Law                                   | Result | Note                                                                   |
| ------------------------------------- | ------ | ---------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import between members                                          |
| Secrets (ADR 0009, ADR 0525)          | PASS   | no credential is an argument; logins are the job's own, over stdin     |
| Security                              | PASS   | Trivy before the push; only a digest is signed and verified            |
| HTTP and events                       | N/A    | none                                                                   |
| Tenancy                               | N/A    | none                                                                   |
| Delegation                            | PASS   | Claude only                                                            |
| Not built yet (ADR 0011)              | PASS   | the Compose smoke and a self-hosted deploy driver stay listed as later |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                                  |
| Versions and catalogs                 | PASS   | a minor changeset for @stackra/runway; tool pins in the workflow       |
| Deploy modes (ADR 0076)               | PASS   | keyless for SaaS and on-prem, KMS for air-gapped                       |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                              |
| Docs and ADRs                         | PASS   | README, AGENTS, runbook, workflows README, ADR 0174 Enforcement        |

## Deploy modes

| Mode       | Behaviour                                                                           |
| ---------- | ----------------------------------------------------------------------------------- |
| SaaS       | ECR image in the shared account, keyless signature, verified at deploy              |
| On-prem    | the same signed image and SBOM; verified with cosign against the same signer        |
| Air-gapped | signed and verified with a KMS cosign key (`kms-key`, `--key`), no Sigstore service |

## Correctness properties

- **P-001**: the build runs in the deploy tree with `--skip-config` and the pinned base — Validates: AC-001
- **P-002**: a failed scan is followed by no push, SBOM or cosign call — Validates: AC-002
- **P-003**: every syft and cosign argument after the push names the registry's digest, never a tag — Validates: AC-003
- **P-004**: keyless verify pins identity (commit, tag or main signer), issuer, repository and caller ref; a signature
  from another caller ref or a branch signer is refused; a key file never reaches cosign — Validates: AC-004
- **P-005**: verify refuses a tag before cosign and refuses on either cosign failure — Validates: AC-005
- **P-006**: no tool runs for a refused input — Validates: AC-006
- **P-007**: the record equals the answered publication and holds no key reference — Validates: AC-007
- **P-008**: a KMS sign and attest name the offline signing config (no log, no TSA) unless one is given, and a KMS
  verify skips the log unless a trusted root is given — Validates: AC-009
- **P-009**: a keyless publish in a job on another ref runs no tool — Validates: AC-010

## Architecture overview

The caller's deploy or release job calls `runway-image.yml`, which builds and gens, signs in to the registry and runs
`stackra runway image:publish`. `publishImage` asks `encoreDeployTree` for the deploy commit (it now also answers the
checkout folder), links the installed `node_modules` into it, runs `encore build docker`, disposes the checkout, then
runs trivy, docker, syft and cosign through the `CommandRunner`, and finally `verifyImage`. The deploy job later runs
`stackra runway image:verify <reference>` before it rolls the image out.

## Components and responsibilities

- `IMAGE_SUPPLY_CHAIN_SETTINGS`: arguments, patterns, signer identity, KMS schemes, file names.
- `imageTrustArguments`: the one trust root (KMS key or keyless identity) for cosign.
- `publishImage`: the ordered step, each failure a `RunwayImageRejectedError` naming the step.
- `verifyImage`: signature and CycloneDX attestation.
- `RunwayImagePublishCommand`, `RunwayImageVerifyCommand`: parse and print.
- `runway-image.yml`: the job.

## Files and folders

```text
.github/workflows/runway-image.yml
.github/workflows/README.md
packages/developer/runway/
  src/core/errors/runway-image-rejected.error.ts
  src/core/types/image-step.type.ts
  src/node/constants/image-supply-chain-settings.constant.ts
  src/node/functions/{publish-image,verify-image,image-trust-arguments}.function.ts
  src/node/functions/encore-deploy-tree.function.ts (answers `dir`)
  src/node/types/{image-publish-request,image-publication,image-verify-request,image-trust,encore-deploy-tree}.type.ts
  src/node/commands/runway-image-{publish,verify}.command.ts
  src/node/constants/runway-commands.constant.ts, src/node/index.ts, src/core/index.ts
  README.md, AGENTS.md
apps/docs/src/docs/runbooks/runway.mdx
apps/docs/src/docs/adr/0174-supply-chain-images-signing-sbom-dependency-policy-and-rotation.mdx
.changeset/runway-image-supply-chain.md
```

## Data models and migrations

none

## Contracts

Additive exports and commands listed in the spec's Impact; the workflow's inputs (`image`, `base-image`,
`environment`, `sha`, `arch`, `registry`, `aws-role`, `aws-region`, `kms-key`, `install-args`, `product`) and outputs
(`reference`, `digest`).

## Error handling

Input faults are `RunwayUnresolvedError` before any tool runs; a tool failure is `RunwayImageRejectedError` with the step
and the tool's message. The checkout is disposed even when the build fails.

## Security and tenancy

No credential is an argument. The keyless certificate is pinned to Runway's workflow (at a commit, `runway-v<n>` tag or
Stackra's main), the caller repository and the caller's ref (`refs/heads/main` by default), so an image signed by
another workflow, repository or branch fails the verify: a collaborator's branch workflow that calls an impostor copy
of `runway-image.yml` without the gate is refused. A KMS signature is air-gapped: no transparency log or timestamp
authority, so no private image digest or key reaches the public Rekor log, and the verify needs no Sigstore trusted
root; a private Sigstore is named by its signing config and trusted root instead.

## Testing strategy

- AC-001, AC-003, AC-007: `publish-image.function.test.ts` asserts the exact ordered calls, the tree, the record.
- AC-002, AC-006: the same file, the scan failure and the refused inputs.
- AC-004, AC-005: `image-trust-arguments.function.test.ts`, `verify-image.function.test.ts` (a fake cosign that checks
  a certificate's claims with the flags given refuses a branch caller and a branch signer).
- AC-009: `publish-image.function.test.ts` (the offline signing config's content at sign time, removed afterwards),
  `verify-image.function.test.ts`; a real run on box 2 against a `hashivault://` key with Sigstore unreachable.
- AC-010: `runway-image-publish.command.test.ts`.
- Commands: `runway-image-publish.command.test.ts`, `runway-image-verify.command.test.ts`.
- AC-008: actionlint and zizmor; the real run on box 2 (encore, Trivy, local registry, syft, cosign).

## Rollout

A minor changeset for `@stackra/runway`. A caller pins `runway-image.yml` by commit with its `runway-v<n>` tag once
released. The Compose smoke test (ADR 0289 decision 8) and a self-hosted deploy driver that pins and verifies the
reference follow under STA-609.

## Delegation and risk plan

Claude only; one wave; R2.

## ADRs

none new; ADR 0174's Enforcement line updated.

## Docs

As listed in the spec.

## Complexity tracking

none

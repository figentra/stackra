# Feature Specification: contracts: Signer port and stackra audit:verify

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-823

**Clarifications status**: complete

**Input**: A signing port with memory and KMS drivers, and the offline `stackra audit:verify` command.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/contracts, packages/developer/cli
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, 0416 (Proposed)
- **New dependencies**: none outside the workspace
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `Signer` (ES256) with `MemorySignerDriver` and `AwsKmsSignerDriver`; `verifySignature`.
- **FR-002** `stackra audit:verify <bundle.jsonl> [--key <keys.json>]` checks links, order and signed checkpoints and exits 1 when broken.

## Not built here

- OS audit writing bundles in the ADR 0416 form.
- Lockfile: `@stackra/cli` gains `@stackra/support`; the lockfile needs the link.

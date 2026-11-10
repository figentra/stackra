# Feature Specification: the signer and secret-store drivers are chosen by config

**Feature Branch**: `figentra/sta-2669-config-driver-defaults`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2669

**Clarifications status**: complete

**Input**: Two ports in `@stackra/config` had two drivers each and no config field that picked one: `Signer`
(ephemeral, kms) and `SecretStore` (memory, aws_secrets_manager). A member that injected either failed to boot with
`UnresolvedPortError` ("its drivers are ephemeral, kms, and no config field selects one"), in production too (the os
audit, RUNWAY). Was stackra#984 and #1009, re-cut on a keyed branch.

### Sources

- `packages/foundation/config/src/core/schemas/signer-options.schema.ts`
- `packages/foundation/contracts/src/core/ports/signer.port.ts`
- `packages/foundation/config/src/contracts/ports/secret-store.port.ts`
- The container's driver selection (`chooseDriver`: test drivers, package default, `selectedBy`, only candidate)
- stackra#964 (`LoggingConfig.reporter`, the same pattern)

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: config (two config fields, a new `SecretsConfig`, constants, types, tests, manifest),
  contracts (`Signer` declares its `~key`); workers/edge manifest (regenerated)
- **Public contract change**: `SignerConfig.driver` and a new `SecretsConfig` (`config.secrets`) with `store`; both
  ports name their selectors in the manifests
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: production selects `kms` for the signer; the defaults keep today's boots
- **Secrets**: none read or added; `SecretStore` only gains a selector
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: packages/foundation/config/README.md
- **Lane**: full
- **Change risk**: R1 (new config fields whose defaults keep today's behaviour)

## Acceptance criteria

- **AC-001**: THE `Signer` port SHALL be selected by `SignerConfig.driver`, defaulting to `ephemeral`.
- **AC-002**: THE `SecretStore` port SHALL be selected by `SecretsConfig.store` (`config.secrets`), defaulting to
  `memory`.
- **AC-003**: WHEN a member boots with no config for either THE container SHALL resolve the default driver, never
  refuse with `UnresolvedPortError`.

## Status history

- 2026-11-10 → Clarified (the os audit's refusal; the selector pattern of stackra#964)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10 (0.33.0)
- 2026-11-10 → Tasked (tasks.md; built in the same branch)

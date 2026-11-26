# Implementation Plan: the signer and secret-store drivers are chosen by config

**Spec**: `.agents/specs/sta-2669-config-driver-defaults/spec.md` · **Linear**: STA-2669 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2669-config-driver-defaults/spec.md`

## Summary

`SignerOptions.driver: DriverName<Signer> = "ephemeral"` and a new `SecretsConfig` with
`SecretsOptions.store: DriverName<SecretStore> = "memory"`. Each port declares its `~key`, the driver-name constants
and registry types join the package, and the config and edge worker manifests name the selectors. Boot tests with no
config get the default drivers.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/foundation/config`, `packages/foundation/contracts`
- **Testing**: vitest in `src/**/__tests__/`, on CI
- **Storage**: none
- **Runtime target**: every member that injects `Signer` or `SecretStore`

## Constitution Check

| Law                                   | Result | Note                                       |
| ------------------------------------- | ------ | ------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import between members              |
| Secrets (ADR 0009)                    | PASS   | no value read or written; a selector only  |
| Security                              | PASS   | production picks kms; defaults are today's |
| HTTP and events                       | N/A    | none                                       |
| Tenancy                               | N/A    | none                                       |
| Delegation                            | PASS   | Claude only                                |
| Not built yet (ADR 0011)              | N/A    | none                                       |
| Test placement (ADR 0022)             | PASS   | tests stay in `__tests__/`                 |
| Versions and catalogs                 | PASS   | a changeset patches config and contracts   |
| Deploy modes (ADR 0076)               | PASS   | same in all three                          |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                  |
| Docs and ADRs                         | PASS   | the config README                          |

## Deploy modes

| Mode       | Behaviour                                             |
| ---------- | ----------------------------------------------------- |
| SaaS       | config picks the drivers; production sets `kms`       |
| On-prem    | config picks the drivers; the defaults need no cloud  |
| Air-gapped | the defaults (`ephemeral`, `memory`) make no call out |

## Correctness properties

- **P-001**: a boot with no config resolves `Signer` to the ephemeral driver; `driver: kms` resolves kms — Validates:
  AC-001
- **P-002**: a boot with no config resolves `SecretStore` to memory; `store: aws_secrets_manager` resolves that —
  Validates: AC-002
- **P-003**: neither boot throws `UnresolvedPortError` — Validates: AC-003

## Architecture overview

The container's `chooseDriver` takes, in order, a test's `useDrivers`, the package default, the config field the
port's manifest names (`selectedBy: "config:<key>.<field>"`), then the only candidate. Both ports gain the third: a
config field whose default names a driver.

## Components and responsibilities

- `SignerConfig` / `SignerOptions.driver`: selects the `Signer` driver.
- `SecretsConfig` / `SecretsOptions.store`: selects the `SecretStore` driver (new, key `config.secrets`).
- `SIGNER_DRIVERS`, `SECRET_STORE_DRIVERS` and their `DriverRegistry` types: the driver names.
- The ports' `~key` and the manifests' `selectedBy`: tie each port to its field.

## Files and folders

```text
packages/foundation/config/
  README.md
  stackra.manifest.json
  src/config/secrets.config.ts
  src/config/__tests__/{secrets,signer}.config.test.ts
  src/contracts/ports/secret-store.port.ts
  src/core/constants/{secret-store-drivers,secrets-config-schema,signer-config-schema,signer-drivers}.constant.ts
  src/core/schemas/{secrets,signer}-options.schema.ts
  src/core/types/{secret-store,signer}-driver-names.type.ts
  src/core/index.ts
  src/core/__tests__/index.test.ts
packages/foundation/contracts/src/core/ports/signer.port.ts
workers/edge/stackra.manifest.json
.changeset/config-signer-driver-field.md
```

## Data models and migrations

none

## Contracts

`SignerConfig.driver` (default `ephemeral`) and `SecretsConfig.store` (default `memory`, key `config.secrets`); the
manifests name both selectors.

## Error handling

An unknown driver name fails the config schema (`z.enum`) at boot, naming the field; no other change.

## Security and tenancy

The signer's production driver stays `kms`, now set by config; nothing reads or writes a secret value.

## Testing strategy

- AC-001: `signer.config.test.ts` (default and kms).
- AC-002: `secrets.config.test.ts` (default and aws_secrets_manager).
- AC-003: both boot with no config through `createTestingModule`.

## Rollout

A patch changeset for `@stackra/config` and `@stackra/contracts`, in 0.33.0. Production sets `signer.driver: kms`.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1.

## ADRs

none

## Docs

`packages/foundation/config/README.md`.

## Complexity tracking

none

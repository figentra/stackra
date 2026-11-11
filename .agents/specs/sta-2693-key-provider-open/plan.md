# Implementation Plan: tenancy: a product extends KeyProvider without a DriverRegistry clash

**Spec**: `.agents/specs/sta-2693-key-provider-open/spec.md` · **Linear**: STA-2693 · **Date**: 2026-11-11

**Input**: Feature specification from `.agents/specs/sta-2693-key-provider-open/spec.md`

## Summary

The `KeyProvider` port drops its `~key` brand; tenancy drops its `contracts.KeyProvider` `DriverRegistry` entry and the
`KEY_PROVIDER_DRIVERS` list, and its shipped schema takes any non-empty driver name (default `ephemeral`). The
`TenantDataKeyStore` entry stays, in a file of its own. `TenantKeysOptions.driver` stays `DriverName<KeyProvider>`, so
the config field still names a port and `selectedBy` still emits.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/foundation/contracts`, `packages/security/tenancy`
- **Testing**: vitest in `src/**/__tests__/`, on the Testbed
- **Storage**: none
- **Runtime target**: every member that hosts tenancy's tenant keys

## Constitution Check

| Law                                   | Result | Note                                       |
| ------------------------------------- | ------ | ------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | no new imports                             |
| Secrets (ADR 0009)                    | N/A    | none                                       |
| Security                              | N/A    | driver names only                          |
| HTTP and events                       | N/A    | none                                       |
| Tenancy                               | PASS   | key handling unchanged                     |
| Delegation                            | PASS   | Claude only                                |
| Not built yet (ADR 0011)              | N/A    | none                                       |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                      |
| Versions and catalogs                 | PASS   | patch changesets for contracts and tenancy |
| Deploy modes (ADR 0076)               | PASS   | same in all three                          |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                  |
| Docs and ADRs                         | N/A    | STA-2675's rule                            |

## Deploy modes

| Mode       | Behaviour                                            |
| ---------- | ---------------------------------------------------- |
| SaaS       | a product's own `KeyProvider` driver can be selected |
| On-prem    | the same                                             |
| Air-gapped | the same                                             |

## Correctness properties

- **P-001**: no package declares the `contracts.KeyProvider` registry entry — Validates: AC-001
- **P-002**: the shipped schema takes a product's driver name and refuses an empty one — Validates: AC-002, AC-003

## Architecture overview

One port opens to products the way identity's `AppApprovalChallenges` did (STA-2675).

## Components and responsibilities

- `KeyProvider` (contracts): no brand.
- `TENANT_KEYS_CONFIG_SCHEMA` and `TenantKeysOptions` (tenancy): an open driver name.
- the `TenantDataKeyStore` registry entry (tenancy): unchanged, in its own file.

## Files and folders

```text
packages/foundation/contracts/src/core/ports/key-provider.port.ts
packages/security/tenancy/src/core/types/key-provider-driver-names.type.ts
packages/security/tenancy/src/core/types/tenant-data-key-store-driver-names.type.ts
packages/security/tenancy/src/core/constants/key-provider-drivers.constant.ts
packages/security/tenancy/src/core/constants/tenant-keys-config-schema.constant.ts
packages/security/tenancy/src/core/schemas/tenant-keys-options.schema.ts
packages/security/tenancy/src/config/__tests__/tenant-keys.config.test.ts
.changeset/key-provider-open.md
```

## Data models and migrations

none

## Contracts

`TenantKeysConfig$.driver`: a non-empty string, default `ephemeral`.

## Error handling

An unknown driver name now fails when the container resolves the port, not at config parse, as for identity's
approval challenges.

## Security and tenancy

none.

## Testing strategy

- AC-001: tenancy's and contracts' typecheck (no entry, no brand), and the os audit wiring on the next bump.
- AC-002, AC-003: `tenant-keys.config.test.ts`.

## Rollout

Patch changesets for `@stackra/contracts` and `@stackra/tenancy`.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

none

## Docs

none

## Complexity tracking

none

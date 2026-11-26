# Implementation Plan: a per-tenant KeyProvider a container can bind

**Spec**: `.agents/specs/sta-2673-tenant-key-provider/spec.md` · **Linear**: STA-2673 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2673-tenant-key-provider/spec.md`

## Summary

@stackra/tenancy gains the `TenantDataKeyStore` port (memory and postgres drivers on `tenancy.tenant_data_keys`) and
two `KeyProvider` drivers selected by `TenantKeysConfig`: `ephemeral` (the default, random keys in process) and `kms`
(the call's tenant, wrapped keys unwrapped through the bound `KmsClient` with a tenant encryption context, a TTL
cache). ADR 0188 records the design.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: tenancy (security), contracts and config (foundation)
- **Testing**: vitest unit tests; the postgres store's integration test (`.int.test.ts`); all on CI
- **Storage**: Postgres, table `tenancy.tenant_data_keys` (migration `0002-create-tenant-data-keys`)
- **Runtime target**: every service that injects `KeyProvider`

## Constitution Check

| Law                                   | Result | Note                                                 |
| ------------------------------------- | ------ | ---------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | tenancy depends on contracts and config, as before   |
| Secrets (ADR 0009)                    | PASS   | no secret value; keys wrapped by KMS, memory only    |
| Security                              | PASS   | tenant encryption context; platform calls refused    |
| HTTP and events                       | PASS   | `TenantDataKeyMinted` in the mint's transaction      |
| Tenancy                               | PASS   | RLS on `tenant_id`; the store refuses another tenant |
| Delegation                            | PASS   | Claude only                                          |
| Not built yet (ADR 0011)              | PASS   | AWS KMS already in the catalog (config's peer)       |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                |
| Versions and catalogs                 | PASS   | a changeset patches tenancy, contracts and config    |
| Deploy modes (ADR 0076)               | PASS   | kms per region; ephemeral where no KMS               |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                            |
| Docs and ADRs                         | PASS   | ADR 0188 amendment of 2026-11-09                     |

## Deploy modes

| Mode       | Behaviour                                                              |
| ---------- | ---------------------------------------------------------------------- |
| SaaS       | `kms` with the region's KMS key; keys stored in that region's database |
| On-prem    | `kms` against the customer's KMS, or `ephemeral` for a trial           |
| Air-gapped | `kms` against a local KMS endpoint, or `ephemeral`; no outbound call   |

## Correctness properties

- **P-001**: a boot with no config binds `KeyProvider` to `ephemeral` and the store to `memory` — Validates: AC-001
- **P-002**: the `kms` driver reads the running tenant and refuses with none — Validates: AC-002
- **P-003**: a first `current()` mints `k1`, stores its wrapped form and records the event — Validates: AC-003
- **P-004**: the postgres store's rows are append-only and another tenant's id is refused — Validates: AC-004
- **P-005**: after `k2`, `current()` is `k2` and `byId("k1")` still opens — Validates: AC-005

## Architecture overview

A service calls `KeyProvider.current()` or `byId(id)`. The `kms` driver takes the call's tenant (`withTenant`),
returns a cached key if fresh, otherwise lists the tenant's wrapped keys from `TenantDataKeyStore`, mints `k1` through
`GenerateDataKeyWithoutPlaintext` when there is none, and unwraps through `KmsClient.decrypt` with the encryption
context `{ stackra:tenant, stackra:key }`, so KMS refuses another tenant's key.

## Components and responsibilities

- `TenantDataKeyStore` port and its `memory` and `postgres` drivers (`TenantDataKey` model, append-only, unique on
  tenant and version).
- `KmsKeyProviderDriver` and `EphemeralKeyProviderDriver`.
- `TenantKeysConfig` (`driver`, `store`, `kmsKeyId`, `region`, `cacheSeconds`, `cacheTenants`).
- `TenantKeyCache` (TTL and tenant-count bounded).
- `TenantDataKeyMinted` event.

## Files and folders

```text
packages/security/tenancy/
  src/contracts/ports/tenant-data-key-store.port.ts
  src/core/{constants,events,schemas,types,values}/*
  src/node/drivers/{kms-key-provider,ephemeral-key-provider,postgres-tenant-data-key-store}.driver.ts
  src/node/models/tenant-data-key.model.ts
  src/node/services/tenant-data-key.service.ts
  src/node/database/migrations/0002-create-tenant-data-keys.migration.ts
  stackra.manifest.json
packages/foundation/contracts/  (KeyProvider key, kmsKeyContext)
packages/foundation/config/     (driver names)
apps/docs/src/docs/adr/0188-operator-access-and-the-encryption-key-hierarchy.mdx
.changeset/tenancy-tenant-key-provider.md
```

## Data models and migrations

`TenantDataKey` (`HasPublicId("tdk")`, `BelongsToTenant`, `AppendOnly`): tenant, version id, wrapped key, KMS key id.
Migration `0002-create-tenant-data-keys` creates `tenancy.tenant_data_keys` with RLS on `tenant_id`, a unique key on
tenant and version, and `UPDATE` revoked.

## Contracts

`TenantDataKeyStore` (`list(tenantId)`, `add(tenantId, key)`); `TenantKeysConfig`; `KeyProvider` drivers `ephemeral`
and `kms`; `kmsKeyContext` exported from contracts; event `TenantDataKeyMinted { tenantId, keyId }`.

## Error handling

A platform call (no tenant) is refused; a store call for another tenant is refused; concurrent first seals keep one
`k1` through the unique key; a KMS failure surfaces as the client's error, never with key material.

## Security and tenancy

Keys are wrapped by the region's KMS key with a tenant encryption context; the table holds ciphertext only under
RLS; unwrapped keys stay in memory, bounded by TTL and tenant count, and are never logged. Deleting a tenant deletes
its rows, which crypto-shreds its data.

## Testing strategy

- AC-001: the tenancy boot and index tests.
- AC-002, AC-003, AC-005: `kms-key-provider.driver.test.ts` and `ephemeral-key-provider.driver.test.ts`.
- AC-004: `postgres-tenant-data-key-store.driver.int.test.ts` (RLS, append-only, another tenant refused).

## Rollout

A patch changeset for tenancy, contracts and config, in 0.33.0. os audit binds `kms` in production with its region's
KMS key and drops its single-key stand-in.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R3: the postgres integration test and the security review in the PR.

## ADRs

ADR 0188 (Accepted): the amendment of 2026-11-09.

## Docs

ADR 0188.

## Complexity tracking

none

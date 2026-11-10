# Feature Specification: a per-tenant KeyProvider a container can bind

**Feature Branch**: `figentra/sta-2673-tenant-key-provider`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2673

**Clarifications status**: complete

**Input**: A service that injects `KeyProvider` (os audit; privacy's salted subject cipher) gets `port_unbound`.
contracts' `AwsKmsKeyProviderDriver` is built per tenant with that tenant's wrapped keys, and
`MemoryKeyProviderDriver` takes its keys as constructor data, so neither is a container driver. os audit runs on a
single-key stand-in in dev and staging, and production audit waits for this (owner decision). Was stackra#955,
re-cut on a keyed branch.

### Sources

- ADR 0188 (decision 2, and its amendment of 2026-11-09 in this change)
- `packages/foundation/contracts` (`KeyProvider`, `AwsKmsKeyProviderDriver`, `MemoryKeyProviderDriver`)
- `packages/foundation/config` (`KmsClient`, an optional peer loaded lazily)
- The markets answer on regions (question 5): each hosting region uses its own regional KMS key

## Impact

- **Apps touched**: none
- **Services touched**: none (os audit and privacy bind it after the release)
- **Packages touched**: tenancy (port, drivers, model, migration, config, event, manifest), contracts (`KeyProvider`
  key, `kmsKeyContext` export), config (driver names)
- **Public contract change**: `TenantDataKeyStore` port; `TenantKeysConfig` (`tenancy.tenant_keys`); `KeyProvider`
  drivers `ephemeral` and `kms`; event `TenantDataKeyMinted`
- **Cross-service events**: `TenantDataKeyMinted { tenantId, keyId }`, recorded in the mint's transaction
- **Tenancy and data**: new tenant-owned table `tenancy.tenant_data_keys` with RLS on `tenant_id`, `UPDATE` revoked,
  ciphertext only
- **Security and privacy**: data keys are wrapped by the region's KMS key with the encryption context
  `{ stackra:tenant, stackra:key }`; unwrapped keys live in memory only, in a TTL cache, never logged
- **Secrets**: none added; the KMS key id is configuration
- **ADR needed**: yes (ADR 0188 amended in this change)
- **New dependencies**: none (the AWS KMS SDK is config's existing optional peer)
- **Deploy modes**: SaaS uses `kms`; on-prem and air-gapped may use `kms` against their own KMS or `ephemeral`
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: ADR 0188
- **Lane**: full
- **Change risk**: R3 (tenant key material and a tenant-owned table)

## Acceptance criteria

- **AC-001**: THE `KeyProvider` port SHALL be bindable by a container through `TenantKeysConfig.driver`, defaulting
  to `ephemeral`.
- **AC-002**: WHEN the `kms` driver serves a call THE driver SHALL use the call's tenant, never input, and refuse a
  platform call.
- **AC-003**: WHEN a tenant has no key THE `kms` driver SHALL mint `k1` on the first seal, store only its wrapped
  form, and record `TenantDataKeyMinted` in the same transaction.
- **AC-004**: THE `TenantDataKeyStore` postgres driver SHALL keep each tenant's keys append-only under RLS, and refuse
  a tenant id other than the running call's.
- **AC-005**: WHEN a key is rotated THE provider SHALL return the newest key from `current()` and still open every
  older key through `byId()`.

## Status history

- 2026-11-09 → Clarified (the design is the ADR 0188 amendment; the leader moved it to CORE-GAPS)
- 2026-11-09 → Planned (plan.md) — Approved by leader 2026-11-09
- 2026-11-10 → Tasked (tasks.md; built in stackra#955, re-cut here)

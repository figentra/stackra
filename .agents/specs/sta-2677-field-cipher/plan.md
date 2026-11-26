# Implementation Plan: a service with encrypted fields binds FieldCipher over its KeyProvider

**Spec**: `.agents/specs/sta-2677-field-cipher/spec.md` · **Linear**: STA-2677 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2677-field-cipher/spec.md`

## Summary

`hasEncryptedFields(ir)` moves out of `emitBoot` into its own helper. In a service where it holds, `emitWiring` adds a
driver table for `contracts.FieldCipher` with the single candidate `aes_gcm` (`AesGcmFieldCipherDriver` from
`@stackra/contracts`, deps `[KeyProvider]`) and puts `KeyProvider` on its worklist, so a declared package's
`KeyProvider` table (tenancy's) is linked.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/gen` (developer)
- **Testing**: vitest in `src/**/__tests__/`, on the Testbed and CI
- **Storage**: none
- **Runtime target**: every service's generated wiring

## Constitution Check

| Law                                   | Result | Note                                       |
| ------------------------------------- | ------ | ------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | the wiring imports contracts, which it may |
| Secrets (ADR 0009)                    | N/A    | none                                       |
| Security                              | PASS   | the cipher the boot already assumed        |
| HTTP and events                       | N/A    | none                                       |
| Tenancy                               | PASS   | keys from the tenant's `KeyProvider`       |
| Delegation                            | PASS   | Claude only                                |
| Not built yet (ADR 0011)              | N/A    | none                                       |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                      |
| Versions and catalogs                 | PASS   | a changeset patches @stackra/gen           |
| Deploy modes (ADR 0076)               | PASS   | same in all three                          |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                  |
| Docs and ADRs                         | N/A    | no rule changes                            |

## Deploy modes

| Mode       | Behaviour                                                   |
| ---------- | ----------------------------------------------------------- |
| SaaS       | encrypted fields seal under the tenant's KMS-wrapped key    |
| On-prem    | encrypted fields seal under the operator's KeyProvider      |
| Air-gapped | encrypted fields seal under the ephemeral or local provider |

## Correctness properties

- **P-001**: a service IR with an encrypted model yields a `contracts.FieldCipher` driver row with `aes_gcm` over
  `KeyProvider` — Validates: AC-001
- **P-002**: with a declared package's `contracts.KeyProvider` table, the wiring lists its candidates — Validates:
  AC-002
- **P-003**: `emitBoot` and `emitWiring` call `hasEncryptedFields` — Validates: AC-003

## Architecture overview

The member's driver tables (`ports`) gain the gen-known cipher table before the worklist runs; the worklist's `link`
then brings the `KeyProvider` table from the declared packages' manifests, as for any port.

## Components and responsibilities

- `hasEncryptedFields`: own models or a declared package's carry `HasEncryptedFields`.
- `emitWiring`: the cipher table and the `KeyProvider` worklist entry.
- `emitBoot`: unchanged output, reading the helper.

## Files and folders

```text
packages/developer/gen/
  src/core/functions/has-encrypted-fields.function.ts
  src/core/functions/emit-boot.function.ts
  src/core/functions/emit-wiring.function.ts
  src/core/functions/__tests__/emit-wiring.function.test.ts
.changeset/gen-field-cipher.md
```

## Data models and migrations

none

## Contracts

none changed.

## Error handling

A service with encrypted fields and no declared `KeyProvider` driver now fails at boot naming `KeyProvider` (no
candidate) instead of `FieldCipher`; the fix is to declare `@stackra/tenancy`.

## Security and tenancy

The cipher seals with the call's tenant key from the bound provider (stackra#1019).

## Testing strategy

- AC-001, AC-002: the wiring emitter test with an encrypted model and a tenancy-like manifest.
- AC-003: the boot golden files stay byte-identical (no golden fixture has encrypted fields).

## Rollout

A patch changeset for `@stackra/gen`, in 0.33.1, after stackra#1019 (tenancy's `KeyProvider` drivers).

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

none

## Docs

none

## Complexity tracking

none

# Feature Specification: a service with encrypted fields binds FieldCipher over its KeyProvider

**Feature Branch**: `figentra/sta-2677-field-cipher`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2677

**Clarifications status**: complete

**Input**: STA-2664 (l), 0.33.1 item 3, from the OS lane's local run (os#305): "No driver is bound to FieldCipher: no
wiring lists a driver for it". The generated boot of a service with `HasEncryptedFields` models builds the
`EncryptedFieldsSubscriber` from `container.get(FieldCipher)`, but `FieldCipher`'s one implementation,
`AesGcmFieldCipherDriver` in `@stackra/contracts`, is a plain subclass of the port (contracts sits below the
container), so no manifest lists it as a driver and no wiring binds it.

### Sources

- `packages/developer/gen/src/core/functions/emit-boot.function.ts` (the encrypted subscriber)
- `packages/developer/gen/src/core/functions/emit-wiring.function.ts` (the per-port driver tables)
- `packages/foundation/contracts/src/core/drivers/aes-gcm-field-cipher.driver.ts`
- stackra#1019 (the tenancy `KeyProvider` drivers, key `contracts.KeyProvider`)
- figentra/os#305, docs/dev-run.md section 5

## Impact

- **Apps touched**: none
- **Services touched**: none (a service with encrypted fields gains two driver rows on the next gen)
- **Packages touched**: packages/developer/gen (a helper, the boot and wiring emitters, tests)
- **Public contract change**: none; the generated wiring binds what the generated boot already resolves
- **Cross-service events**: none
- **Tenancy and data**: encrypted fields seal under the tenant's data key from the bound `KeyProvider`
- **Security and privacy**: `FieldCipher` is AES-256-GCM under the `KeyProvider`'s keys, as the boot assumed
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: none
- **Lane**: full
- **Change risk**: R2 (the binding of the field cipher a service's encrypted rows use)

## Acceptance criteria

- **AC-001**: WHEN a service has a model with `HasEncryptedFields` (its own or a declared package's) THE generated
  wiring SHALL bind `FieldCipher` (`contracts.FieldCipher`) to `AesGcmFieldCipherDriver` over `KeyProvider`.
- **AC-002**: WHEN such a service declares the package of a `KeyProvider` driver table THE generated wiring SHALL list
  that table, so `KeyProvider` resolves.
- **AC-003**: THE boot and the wiring SHALL read "has encrypted fields" from one helper.

## Status history

- 2026-11-10 → Clarified (the cipher is a plain class, so gen must name it)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10 (0.33.1 item 3)
- 2026-11-10 → Tasked (tasks.md; built in the same branch, stacked on STA-2674)

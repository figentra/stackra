# Feature Specification: tenancy: a product extends KeyProvider without a DriverRegistry clash

**Feature Branch**: `figentra/sta-2693-key-provider-open`

**Created**: 2026-11-11

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2693

**Clarifications status**: complete

**Input**: os#311 (the os bump to 0.33.0) fails typecheck in its audit service: `.stackra/gen/wiring.ts TS2717:
Property '"contracts.KeyProvider"' must be of type '"ephemeral" | "kms"', but here has type '"audit"'`.
`@stackra/tenancy` declares a closed `DriverRegistry` entry for `contracts.KeyProvider`, and audit ships its own
`KeyProvider` driver. Tenancy's shipped `TenantKeysConfig$` also has `driver: z.enum(["ephemeral", "kms"])`, so
`driver: "audit"` would be refused at config parse too. This is the rule STA-2675 applied to identity's
`AppApprovalChallenges`: a port that products extend gets no hand-written registry entry or `~key` brand in a package,
and the member's generated wiring is its only declarer.

### Sources

- os#311 (the leader's report, 2026-11-11); STA-2675 commit dd9c9d616 (the identity precedent)
- `packages/foundation/contracts/src/core/ports/key-provider.port.ts`;
  `packages/security/tenancy/src/core/types/key-provider-driver-names.type.ts`

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `@stackra/contracts` (the port's brand), `@stackra/tenancy` (registry entry, config schema)
- **Public contract change**: `TenantKeysConfig$.driver` accepts any non-empty driver name; `DriverName<KeyProvider>`
  reads the member's registered names instead of tenancy's two
- **Cross-service events**: none
- **Tenancy and data**: none (driver selection only; keys stay wrapped)
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no (STA-2675's rule, ADR 0294 decision 16)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: none
- **Lane**: full
- **Change risk**: R2 (a shipped port's type brand and a config schema)

## Acceptance criteria

- **AC-001**: THE `KeyProvider` port SHALL carry no `~key` brand, AND `@stackra/tenancy` SHALL declare no `DriverRegistry` entry for it.
- **AC-002**: WHEN a member's config selects a `KeyProvider` driver that a product ships THE shipped `TenantKeysConfig$` SHALL accept its name.
- **AC-003**: WHEN the `KeyProvider` driver name is empty THE shipped `TenantKeysConfig$` SHALL refuse it.

## Status history

- 2026-11-11 → Clarified (leader: STA-2675's rule applied to KeyProvider)
- 2026-11-11 → Planned (plan.md) — Approved by leader 2026-11-11
- 2026-11-11 → Tasked (tasks.md)

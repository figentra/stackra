# Feature Specification: gen reads its own entities file as generated, not as an authored `[OptionalProps]`

**Feature Branch**: `figentra/sta-2688-gen-authored-optional`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2688

**Clarifications status**: complete

**Input**: the root cause of STA-2687. Gen gave `@stackra/tenancy`'s `TenantDataKey` `optional: []` on one run and
`optional: ["id", "tenantId"]` on the next. A checker probe on a Testbed box showed the trait fields resolve fine;
what differs is that gen counts an `[OptionalProps]` declared in any file under `src/` as one the member wrote beside
its model ("a generated one would redeclare it"), and a package's `src/node/entities.gen.ts` is gen's own output. So
gen reads its previous augmentation as authored, writes none, and the next run writes it back: gen flip-flops on
every package model with trait or initialised fields, and the gate's "Committed manifests match gen" passes or fails
by which file was there before.

### Sources

- `packages/developer/gen/src/node/functions/create-source-reader.function.ts` (the authored `[OptionalProps]` check)
- `packages/developer/gen/src/core/constants/package-entities-file.constant.ts` (`PACKAGE_ENTITIES_FILE`)
- stackra#1030, #1031, #1032 (the flip on `TenantDataKey`); the box probe of 2026-11-10

## Impact

- **Apps touched**: none
- **Services touched**: none (a service's entities file is under `.stackra/gen`, never under `src/`)
- **Packages touched**: packages/developer/gen (one check, a test fixture)
- **Public contract change**: none; every package model gets the same augmentation on every run
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: none
- **Lane**: full
- **Change risk**: R2 (gen output of every package model)

## Acceptance criteria

- **AC-001**: WHEN a package's `src/node/entities.gen.ts` holds gen's `[OptionalProps]` augmentation THE source reader SHALL still read the model's optional keys from its traits and initialisers.
- **AC-002**: WHEN the member writes its own `[OptionalProps]` beside its model THE source reader SHALL leave the keys out, as before (STA-1750).

## Status history

- 2026-11-10 → Clarified (the box probe: the trait fields resolve; the check reads gen's own file as authored)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10 (0.33.1, ahead of (i))
- 2026-11-10 → Tasked (tasks.md)

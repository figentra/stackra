# Feature Specification: tenancy: restore the generated TenantDataKey optional fields CI's gen writes

**Feature Branch**: `figentra/sta-2687-tenancy-regen`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2687

**Clarifications status**: complete

**Input**: blocks the 0.33.0 cut. stackra#1030 committed `@stackra/tenancy`'s `entities.gen.ts` and manifest as a
Testbed box's gen wrote them: `TenantDataKey` with `optional: []` and no `[OptionalProps]` augmentation. CI's gen on
main's own tree writes `optional: ["id", "tenantId"]` and the augmentation, so the Quality Gate's "Committed
manifests match gen" step fails on main (stackra#1031, and the Version Packages pull request #946). CI's gen is the
gate's, so its output is the committed one. Why the box's gen read the model's trait fields differently is a
separate 0.33.1 fix.

### Sources

- stackra#1031's gate (Committed manifests match gen, packages/security/tenancy)
- stackra#1030 (commit 2b70b520d: the box's regenerated tenancy files)
- `packages/security/tenancy/src/node/models/tenant-data-key.model.ts` (`HasPublicId("tdk")`, `BelongsToTenant`)

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/security/tenancy (two generated files)
- **Public contract change**: none; `TenantDataKey`'s `id` and `tenantId` are optional to `em.create` again, as
  #1019 shipped them
- **Cross-service events**: none
- **Tenancy and data**: none; no schema or migration change
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: none
- **Lane**: full
- **Change risk**: R1 (generated files back to the gate's output)

## Acceptance criteria

- **AC-001**: THE committed tenancy `entities.gen.ts` and manifest SHALL equal what CI's gen writes on this tree.
- **AC-002**: WHEN the Quality Gate runs on this branch THE "Committed manifests match gen" step SHALL pass.

## Status history

- 2026-11-10 → Clarified (leader: CI's gen is canonical; a regen-labelled PR)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10
- 2026-11-10 → Tasked (tasks.md)

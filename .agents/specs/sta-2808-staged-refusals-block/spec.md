# Feature Specification: gen's staged refusals block everywhere

**Feature Branch**: `figentra/sta-2808-staged-refusals-block`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: leader

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-2808

**Linear project**: none

**Clarifications status**: complete

**Input**: Five gen checks promised as hard errors by 0.20 still only warned unless `STACKRA_GEN_STRICT=1` was set,
which only the flow-preset gate did. An app could ship a write at L1, a client write with no idempotency, a
security-risk action with no step-up, or a tenant model with no row-security migration, and still pass gen.

### Sources

- STA-2808 (child of STA-2796, production-readiness batch 3, item 3.3); related STA-2096 and STA-1620
- The audit claim checked against origin/main 9f01f9c06: `STAGED_REFUSAL_CODES` in
  `packages/developer/gen/src/core/constants/staged-refusal-codes.constant.ts` and the downgrade in
  `generateMember` (`packages/developer/gen/src/core/functions/generate-member.function.ts`) — FR-001
- `checkGenStrictEnv` in `packages/developer/repo-checks/src/node/functions/check-gen-strict-env.function.ts`, the
  `env` lists in `turbo.jsonc`, the flow-preset gate in `packages/developer/flow-preset/preset/preset.yml` and the
  test-infrastructure runbook — FR-002
- The refusal golden fixtures under `packages/developer/gen/__golden__/` — FR-003
- The emitted tenant-isolation test (`emitIsolationTest`), whose `assertRowSecurity` is strict by default since the
  tenancy contract step — FR-004
- The 0.19 changelog promise ("warns in 0.19, refuses in 0.20") in ADR 0239 decision 7 and the ADR 0347 note — FR-005

## Impact

- **Apps touched**: none (`apps/docs` gets one runbook edit only)
- **Services touched**: none (every core member, service and worker already passes `stackra gen --check`)
- **Packages touched**: packages/developer/gen, packages/developer/repo-checks, packages/developer/flow-preset
- **Public contract change**: breaking for callers of the library API: `generate()` and `generateMember()` drop the
  `strict` option; `@stackra/repo-checks` drops the `checkGenStrictEnv` export and its `gen-strict-env` finding; the
  `STACKRA_GEN_STRICT` variable is no longer read. The five refusal codes keep their names and messages; only their
  severity changes (warning to refusal). No `stackra.manifest.json` or `openapi.json` changes.
- **Cross-service events**: none
- **Tenancy and data**: strengthens it: `model_tenancy_migration_missing` now refuses everywhere, and the generated
  tenant-isolation test relies on the strict `assertRowSecurity` audit
- **Security and privacy**: strengthens it: the write floor (L2 and up), step-up on L3 and L4 user actions and
  idempotency on client writes can no longer be skipped by leaving a variable unset
- **Secrets**: none
- **ADR needed**: no new ADR: implements ADR 0099 (the write floor), ADR 0136 decision 3 (idempotency), ADR 0406
  (step-up) and ADR 0239 decision 1 (the tenancy migration); ADR 0239 decision 7 and the ADR 0347 note already
  promised this for 0.20
- **New dependencies**: none
- **Deploy modes**: same in all three (build-time check only)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: packages/developer/gen/README.md (the staged note);
  apps/docs/src/docs/runbooks/test-infrastructure.mdx (the strict-env example); the changeset
  `.changeset/gen-staged-refusals-block.md` (the upgrade notes)
- **Lane**: full
- **Change risk**: R2 (breaking for adopters whose code trips one of the five; the changeset says how to check before
  upgrading)

## Glossary

- **Staged refusal**: one of the five gen codes that 0.19 printed as a warning unless gen ran strict:
  `action_risk_below_write`, `query_above_l1`, `step_up_missing`, `idempotency_missing`,
  `model_tenancy_migration_missing`.
- **Refusal**: a gen finding with no `severity: "warning"`; it blocks the run and gen writes no file of that pass.

## User Scenarios & Testing

### User Story 1 - A staged check blocks with no switch (Priority: P1)

A product author declares an action at `Permission.L1`, a write with no `idempotency`, an L3 action with no
`stepUp`, a query above L1 with no reason, or an owned model whose table no migration gives the tenant column. Gen
refuses with that code and writes nothing, whether or not `STACKRA_GEN_STRICT` is set.

**Independent Test**: `generateMember` over the commerce fixture with each of the five faults.

### User Story 2 - Nothing reads the variable any more (Priority: P2)

A repository that still lists `STACKRA_GEN_STRICT` in its turbo `env` gets no finding for it and no behaviour from
it; the Flow gate runs `pnpm gen:check` without it.

**Independent Test**: the repo-checks suite has no `gen-strict-env` finding; the preset's gate list.

### Edge Cases

- **EC-01**: A member with a staged fault and another refusal reports both as refusals, sorted by the golden order.
- **EC-02**: A warning that is not one of the five (for example STA-340's other warnings) still prints and never
  blocks.
- **EC-03**: `generate()` in non-check mode that is refused still writes the clients and manifest passes when those
  passes have no refusal, as before; it just never downgrades the five.

## Requirements

### Functional Requirements

- **FR-001**: THE gen `generateMember` SHALL report `action_risk_below_write`, `query_above_l1`, `step_up_missing`,
  `idempotency_missing` and `model_tenancy_migration_missing` as refusals in every run, and `STAGED_REFUSAL_CODES`
  and the `strict` option of `generateMember` and `generate` SHALL be removed.
- **FR-002**: THE repository SHALL read `STACKRA_GEN_STRICT` nowhere: not in gen, not in `@stackra/repo-checks`
  (`checkGenStrictEnv` and the `gen-strict-env` finding removed), not in the `turbo.jsonc` gen task `env` lists, not
  in the flow-preset gate and not in the test-infrastructure runbook.
- **FR-003**: THE refusal golden snapshots SHALL record each staged code they hit as a refusal with no `severity`.
- **FR-004**: THE tenant-isolation test that `emitIsolationTest` writes SHALL call `assertRowSecurity` without
  collecting or printing warnings.
- **FR-005**: (example-only: the changeset text) THE changeset SHALL mark `@stackra/gen` and `@stackra/repo-checks` as breaking (minor before 1.0) and
  `@stackra/flow-preset` as a patch, and SHALL say how to find what the new version refuses before upgrading.

## Acceptance criteria

- **AC-001**: WHEN gen runs on a member that trips any of the five staged codes THE gen SHALL return that code in
  `errors`, not in `warnings`, and write no file.
- **AC-002**: WHEN `STACKRA_GEN_STRICT` is unset THE gen SHALL refuse the five codes exactly as it does when it is
  set.
- **AC-003**: WHEN `stackra gen --check` runs over every core member, service and worker THE run SHALL report no
  refusal and no drift.
- **AC-004**: THE emitted tenant-isolation test SHALL contain no `warnings` loop.
- **AC-005**: WHEN `stackra check` reads a `turbo.jsonc` THE repo checks SHALL report no `gen-strict-env` finding,
  and THE `@stackra/repo-checks` node entry SHALL export no `checkGenStrictEnv`.
- **AC-006**: THE refusal golden fixtures SHALL list `idempotency_missing` as a refusal, and THE gen golden test SHALL
  pass.

## Success Criteria

- **SC-001**: `generate-member.function.test.ts` proves AC-001 and AC-002 for each of the five codes — verified by:
  unit
- **SC-002**: `emit-isolation-test.function.test.ts` proves AC-004 — verified by: unit
- **SC-003**: the gen golden test and the typecheck and tests of gen, repo-checks, flow-preset and cli pass, and
  `stackra gen --check` is clean across the workspace — verified by: unit and a workspace run

## Out of scope

- The template's own adoption: stackra-template still lists `STACKRA_GEN_STRICT` in its gen task `env` while it pins
  `@stackra/cli` 0.15.0, which still reads it; the change that moves the template onto the release carrying this
  removes it (template PR stackra-inc/stackra-template#62).
- Editing ADR 0239 decision 7 or the ADR 0347 note: they already say the five refuse from 0.20, which the code now
  does.
- `assertRowSecurity` itself: it is already strict by default.

## Assumptions

- No core member trips one of the five today (checked: `stackra gen --check` passes for all 115 root members and in
  each service and worker), so the change breaks no member of this repository.
- An adopter on 0.19 can see exactly what 0.20 refuses by running `stackra gen --check` with `STACKRA_GEN_STRICT=1`
  on their current version.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 → Draft · created from the batch 3 audit (item 3.3)
- 2026-11-26 → Clarified · no open question: the five codes and the promise come from the 0.19 changelog and
  ADR 0239 decision 7
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-26
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing · T001 to T009 done on the branch; T010 (the box run) open

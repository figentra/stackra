# Tasks: `pnpm new` scaffolds members in the programming model v3 shape

**Input**: `.agents/specs/sta-347-v3-scaffold/`

## Phase 1: Structure data and the validator transition

- [x] T001 [US1] v3 tables, entries and lookups in `tools/scripts/structure.mjs`, rendered to `apps/docs/src/standards/structure.mdx` — covers: FR-006, P-005 — route: spec-task
- [x] T002 [US4] Transition branch `isV2Service` in `tools/scripts/validate-repository.mjs` — covers: FR-005, P-004, EC-03 — route: spec-task
- [x] T003 [US4] Tests in `tools/scripts/__tests__/structure.test.mjs` and `tools/scripts/__tests__/validate-repository.test.mjs` — covers: FR-005, FR-006, P-004, P-005 — route: tests — deps: T001, T002

## Phase 2: Package and service templates

- [x] T004 [US1] Package template in `tools/scaffold/templates/packages/package`, optional entries in `tools/scaffold/templates/packages/entries` and database folders in `tools/scaffold/templates/packages/data`; exports, imports and `--data` in `tools/scripts/scaffold.mjs` — covers: FR-001, FR-003, P-001, P-002, EC-01, EC-02, EC-04 — route: spec-task — deps: T001
- [x] T005 [US2] Service template in `tools/scaffold/templates/services/service` — covers: FR-002, P-001 — route: spec-task — deps: T002

## Phase 3: App templates

- [x] T006 [US3] Console, mobile and desktop templates in `tools/scaffold/templates/apps`, with the `apps/*` entries in `knip.jsonc` — covers: FR-004, P-003 — route: spec-task — deps: T001

## Phase 4: Tests and docs

- [x] T007 [US1] Scaffold tests in `tools/scripts/__tests__/scaffold.test.mjs` — covers: FR-001, FR-002, FR-003, FR-004, P-001, P-002, P-003 — route: tests — deps: T004, T005, T006
- [x] T008 [US1] Docs in `apps/docs/src/guides/scaffolding.mdx` and `tools/scaffold/README.md` — covers: SC-001, SC-002 — route: steward-docs — deps: T004, T005, T006

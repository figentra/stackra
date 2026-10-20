# Tasks: Brand kit adoption

**Input**: `.agents/specs/sta-173-brand-kit-adoption/`

## Phase 1: User Story 1 - One brand source

- [x] T001 [US1] Vendor the kit into `packages/experience/brand/assets` and export `./assets/*` in `packages/experience/brand/package.json` — covers: FR-001, P-001 — route: spec-task
- [x] T002 [US1] NOTICE in `packages/experience/brand/assets/NOTICE`, root `NOTICE`, ADR 0024 path and the check in `tools/scripts/validate-repository.mjs` — covers: FR-002, P-002, EC-01 — route: spec-task — deps: T001
- [x] T003 [US1] Tests in `packages/experience/brand/src/__tests__/assets.test.ts` — covers: FR-001, FR-002, P-001, P-002 — route: tests — deps: T001, T002

## Phase 2: User Story 2 - New apps start branded

- [x] T004 [US2] Brand `apps/mobile/app.json`, `apps/mobile/src/global.css` and `apps/docs/src/docs.json` — covers: SC-001, SC-002 — route: spec-task — deps: T001
- [x] T005 [US2] Brand the templates in `tools/scaffold/templates/apps` (console, mobile, desktop, docs) — covers: FR-003, P-003 — route: spec-task — deps: T001
- [x] T006 [US2] Test in `tools/scripts/__tests__/scaffold.test.mjs` — covers: FR-003, P-003 — route: tests — deps: T005

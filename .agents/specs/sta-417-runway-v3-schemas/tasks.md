# Tasks: Runway v3 schemas and the v3 TypeScript role presets

**Input**: `.agents/specs/sta-417-runway-v3-schemas/`

## Phase 1: User Story 1 - A runway v3 file validates against its schema

- [x] T001 [US1] Root schema in `tools/schemas/runway-root.schema.json` — covers: FR-001, FR-002, P-001, EC-01 — route: spec-task
- [x] T002 [US1] Member schemas in `tools/schemas/runway-service.schema.json` and `tools/schemas/runway-app.schema.json` — covers: FR-003, FR-004, P-002, EC-02 — route: spec-task
- [x] T003 [US1] Validate with ajv 8.20.0 (draft 2020-12): the template's seven runway files pass and eight negative cases are refused — covers: P-001, P-002, SC-001 — route: tests — deps: T001, T002
- [ ] T004 [US1] After merge, confirm the static host serves the v3 schemas and the owner's `schemas@1.0.0` tag publishes the immutable release — covers: SC-003 — route: release-check — deps: T003

## Phase 2: User Story 2 - A v3 member extends its role preset

- [x] T005 [US2] `library` DOM and JSX, the five role presets and their exports in `packages/tooling/typescript/src/library.json`, `packages/tooling/typescript/src/service.json`, `packages/tooling/typescript/src/mobile.json`, `packages/tooling/typescript/src/tooling.json`, `packages/tooling/typescript/src/desktop.json`, `packages/tooling/typescript/src/service-worker.json` and `packages/tooling/typescript/package.json` — covers: FR-005, FR-006, P-003, P-004, EC-03 — route: spec-task
- [x] T006 [US2] Tests in `packages/tooling/typescript/src/__tests__/presets.test.ts` (written, not run) — covers: FR-005, FR-006, P-003, P-004 — route: tests — deps: T005
- [x] T007 [US2] Preset table in `packages/tooling/typescript/README.md` and the minor changeset `.changeset/typescript-config-v3-roles.md` — covers: FR-005, FR-006 — route: steward-changesets — deps: T005
- [x] T008 [US2] Dated Note in `apps/docs/src/docs/adr/0300-published-tooling-presets-and-enforced-spell-checking.mdx` and its row in `apps/docs/src/docs/adr/index.mdx` — covers: FR-005, FR-006 — route: adr — deps: T005
- [ ] T009 [US2] Run the preset tests, typecheck and build for `@stackra/typescript-config` (deferred by owner direction 2026-10-24) — covers: SC-002, P-003, P-004 — route: verify-fix — deps: T006

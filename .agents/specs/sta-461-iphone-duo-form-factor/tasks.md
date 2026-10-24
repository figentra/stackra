# Tasks: iOS form-factor rules for the iPhone Duo and resizable windows

**Input**: `.agents/specs/sta-461-iphone-duo-form-factor/`

## Phase 1: User Story 1 - A person uses the app on the iPhone Duo or in a resizable window

- [x] T001 [US1] No portrait lock and the scene lifecycle in `apps/mobile/app.json` and `tools/scaffold/templates/apps/mobile/app.json` — covers: FR-001, P-001, EC-01 — route: mobile
- [x] T002 [US1] `checkIosFormFactor` and `checkWindowSizing` in `tools/scripts/validate-repository.mjs` — covers: FR-002, P-002 — route: spec-task
- [x] T003 [US1] Tests in `tools/scripts/__tests__/validate-repository.test.mjs` — covers: FR-001, FR-002, P-001, P-002, EC-01, SC-001 — route: tests — deps: T002

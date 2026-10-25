# Tasks: `@stackra/coding-standard`

**Input**: `.agents/specs/sta-348-coding-standard/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-coding-standard/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/developer/coding-standard` — covers: FR-001, FR-006 — route: package — deps: T001
- [x] T003 [US1] Structural types in `packages/developer/coding-standard/src/core/types/` and helpers in `packages/developer/coding-standard/src/core/functions/` — covers: FR-005, FR-007 — route: package — deps: T002
- [x] T004 [US1] `KIND_BASES`, `RETIRED_DECORATORS` and `base-matches-suffix` — covers: FR-003, US1 — route: package — deps: T003
- [x] T005 [US2] `lines-between-class-members`, `multiline-decorator-options`, `docblock-shape` with autofixes — covers: FR-003, FR-004, US2, P-002 — route: package — deps: T003
- [x] T006 [US3] `no-empty-decorator`, `no-kind-decorator`, `no-parameter-decorator`, `one-declaration-per-file`, `no-empty-module`, `no-enum`, `no-hash-private` — covers: FR-003, US3 — route: package — deps: T004
- [x] T007 [US4] `hook-file-name`, `member-order`, `disable-needs-reason` — covers: FR-003, US4 — route: package — deps: T003
- [x] T008 [US1] `STACKRA_PLUGIN` registering every rule — covers: FR-002 — route: package — deps: T004, T005, T006, T007
- [x] T009 [US1] Rule tests (`RuleTester`) and helper tests in `packages/developer/coding-standard/src/**/__tests__/` — covers: SC-002, P-001 — route: tests — deps: T008
- [x] T010 [US1] Changeset `.changeset/coding-standard-package.md` — covers: FR-002 — route: package — deps: T008
- [x] T011 [US1] `oxfmt --check` and `oxlint` on the package — covers: SC-003 — route: package — deps: T009
- [ ] T012 [US1] Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T011
- [ ] T013 [US1] Turn the rules on in `@stackra/oxlint-config` and add the reasoned disables framework kind packages need (preset owner) — covers: FR-003 — route: package — deps: T012

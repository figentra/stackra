# Tasks: `@stackra/support` wave 1a

**Input**: `.agents/specs/sta-348-support/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-support/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/foundation/support` — covers: FR-001, FR-005, SC-003 — route: package — deps: T001
- [x] T003 [US1] `time` in `packages/foundation/support/src/core/constants/time.constant.ts` — covers: FR-002, FR-003, FR-004, FR-006, P-001, P-002 — route: package — deps: T002
- [x] T004 [US1] Tests in `packages/foundation/support/src/core/constants/__tests__/time.constant.test.ts` — covers: SC-002 — route: tests — deps: T003
- [x] T005 [US1] Changeset `.changeset/support-package.md` — covers: SC-001 — route: package — deps: T003
- [ ] T006 [US1] Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T004

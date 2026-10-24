# Tasks: `@stackra/contracts` wave 1a

**Input**: `.agents/specs/sta-348-contracts/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-contracts/` — covers: SC-001 — route: spec-draft
- [x] T002 [US3] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/foundation/contracts` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] `Enum` and `Port` in `src/core/bases/` — covers: FR-003, FR-004, P-001 — route: package — deps: T002
- [x] T004 [US1] The nine enums in `src/core/enums/`, one `Tone` — covers: FR-002, FR-003, FR-006 — route: package — deps: T003
- [x] T005 [US2] `Clock`, `Logger`, `IdentityResolver` in `src/core/ports/` — covers: FR-004 — route: package — deps: T003
- [x] T006 [US4] Types (`Actor`, `PublicId`, `Branded`, `Email`, `Url`, `Json`, `VerifiedPrincipal`, `StackraManifest`, the four definitions) in `src/core/types/` — covers: FR-002, FR-007, FR-008 — route: package — deps: T004
- [x] T007 [US4] `Duration` in `src/core/constants/` — covers: FR-005, P-002 — route: package — deps: T006
- [x] T008 [US3] `brand` and `defineApp`, `defineService`, `definePackage`, `defineWorker` in `src/core/functions/` — covers: FR-002 — route: package — deps: T006
- [x] T009 [US1] Stand-in barrel `src/core/index.ts` and its export-list test — covers: FR-002 — route: package — deps: T008
- [x] T010 [US1] Tests for every public symbol in `src/**/__tests__/`, with the loyalty-kit manifest fixture — covers: SC-002 — route: tests — deps: T009
- [x] T011 [US1] Changeset `.changeset/contracts-package.md`; `oxfmt` and `oxlint` clean — covers: SC-001, SC-003 — route: package — deps: T010
- [ ] T012 [US1] Run the package's tests, typecheck (TypeScript 7.0.2 and 6.0.3) and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T010

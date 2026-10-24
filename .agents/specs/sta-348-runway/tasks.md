# Tasks: `@stackra/runway` wave 2

**Input**: `.agents/specs/sta-348-runway/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-runway/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, LICENSE) in `packages/developer/runway` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US2] Enums and zod schemas in `src/core/{enums,constants}/` — covers: FR-004, FR-005 — route: package — deps: T002
- [x] T004 [US2] `parseRunway`, `checkPlacement`, `runwayJsonSchema`, errors and types in `src/core/` — covers: FR-002 — route: package — deps: T003
- [x] T005 [US2] Committed `schema/{root,app,service}.json` from `runwayJsonSchema` — covers: SC-001 — route: package — deps: T004
- [x] T006 [US1] Facts reader and `baseUrlOf`, `devPorts`, `updateFeed` in `src/core/functions/` — covers: FR-002, FR-006 — route: package — deps: T003
- [x] T007 [US1] `definesFor`, `devServer`, `readRunway` in `src/node/` — covers: FR-003, FR-007 — route: package — deps: T006
- [x] T008 [US1, US2] Tests beside every public symbol (`__tests__/`) — covers: SC-002 — route: tests — deps: T007
- [x] T009 [US1] Changeset `.changeset/runway-package.md` — covers: SC-001 — route: package — deps: T007
- [ ] T010 [US1, US2] Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-003 — route: tests — deps: T008

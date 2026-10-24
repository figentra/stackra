# Tasks: `@stackra/ai` wave 4

**Input**: `.agents/specs/sta-348-ai/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-ai/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/application/ai` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `Prompt`, `Skill`, `Facts` in `packages/application/ai/src/core/bases/` — covers: FR-002, FR-003, FR-004, P-003, P-004 — route: package — deps: T002
- [x] T004 [US2] `ToolSource`, `Approval` in `packages/application/ai/src/core/enums/` and `approvalFor` in `packages/application/ai/src/core/functions/` — covers: FR-002, FR-005, P-005 — route: package — deps: T002
- [x] T005 [US3] `decide` in `packages/application/ai/src/core/functions/` — covers: FR-006, P-006 — route: package — deps: T002
- [x] T006 [US1] Types in `packages/application/ai/src/core/types/` and the stand-in barrel `packages/application/ai/src/core/index.ts` — covers: FR-002, P-002 — route: package — deps: T005
- [x] T007 [US1] Tests for every public symbol in `src/**/__tests__/` and the barrel test — covers: SC-002 — route: tests — deps: T006
- [x] T008 [US1] Changeset `.changeset/ai-package.md`; `oxfmt` and `oxlint` clean — covers: SC-001, SC-003 — route: package — deps: T007
- [ ] T009 [US1] Pin `ai` in the catalog, `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T007

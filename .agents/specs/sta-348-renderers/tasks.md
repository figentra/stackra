# Tasks: `@stackra/renderers` wave 2

**Input**: `.agents/specs/sta-348-renderers/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-renderers/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/developer/renderers` — covers: FR-001 — route: package — deps: T001
- [x] T003 `Assistant`, `RenderInputError` and the result types — covers: FR-002 — route: package — deps: T002
- [x] T004 `KIRO_TOOLS`, `OPENCODE_ACTIONS`, `CLAUDE_HOOK_EVENTS` — covers: FR-005 — route: package — deps: T002
- [x] T005 `composeMarkdown`, `provenanceComment`, `demoteHeadings` — covers: FR-004 — route: package — deps: T002
- [x] T006 [US2] The five per-assistant renderers — covers: FR-004, FR-005 — route: package — deps: T003, T004, T005
- [x] T007 [US1] `renderAssistant` and the stand-in barrel for `.` — covers: FR-002, FR-003 — route: package — deps: T006
- [x] T008 Tests beside every subject and the barrel test — covers: SC-002 — route: tests — deps: T007
- [x] T009 Changeset `.changeset/renderers-package.md` — covers: SC-001 — route: package — deps: T007
- [ ] T010 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002, SC-003 — route: tests — deps: T008

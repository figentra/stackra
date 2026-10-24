# Tasks: `@stackra/skills`

**Input**: `.agents/specs/sta-348-skills/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-skills/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/developer/skills` — covers: FR-001, FR-006 — route: package — deps: T001
- [x] T003 [US2] Enums, types, error, frontmatter schemas, `splitFrontMatter`, `documentName`, `parseAgentDocument` in `packages/developer/skills/src/core/` — covers: FR-002, FR-004, US2 — route: package — deps: T002
- [x] T004 [US1] `KIND_FOLDERS`, `bundledRoot`, `loadSkillSet` in `packages/developer/skills/src/node/` — covers: FR-003, US1 — route: package — deps: T003
- [x] T005 [US3] Shipped layer-1 rules and skills in `packages/developer/skills/assets/` — covers: FR-005, US3 — route: package — deps: T004
- [x] T006 [US1] Unit tests for every symbol in `packages/developer/skills/src/**/__tests__/` — covers: SC-002, FR-007, P-001, P-002 — route: tests — deps: T005
- [x] T007 [US1] Changeset `.changeset/skills-package.md` — covers: FR-002 — route: package — deps: T004
- [x] T008 [US1] `oxfmt --check` and `oxlint` on the package — covers: SC-003 — route: package — deps: T006
- [ ] T009 [US1] Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T008
- [ ] T010 [US3] Move the Stackra content: delete the `.agents/` originals and point `agents-sync` at this package (ADR 0282 open detail 1; owner of `.agents/`) — covers: FR-005 — route: package — deps: T009

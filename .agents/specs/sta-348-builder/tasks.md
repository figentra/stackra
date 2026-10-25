# Tasks: `@stackra/builder` wave 7

**Input**: `.agents/specs/sta-348-builder/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-builder/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/experience/builder` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] [US3] `EditorNode`, `EditorChangeKind`, `EditorChange`, `EditorState` and `EditorOptions` in `packages/experience/builder/src/contracts` — covers: FR-001, FR-005 — route: package — deps: T002
- [x] T004 [US3] `parseDocumentNode`, the bounds, the patterns and `DocumentInvalidError` in `packages/experience/builder/src/core` — covers: FR-005, P-005 — route: package — deps: T003
- [x] T005 [US1] `applyChange`, `blockIds` and the change refusals in `packages/experience/builder/src/core` — covers: FR-002, P-002 — route: package — deps: T004
- [x] T006 [US1] [US2] [US3] `Editor` in `packages/experience/builder/src/core/values` — covers: FR-002, FR-003, FR-004, P-002, P-003, P-004 — route: package — deps: T005
- [x] T007 [US2] `useEditor` and `useSelection` in `packages/experience/builder/src/react` — covers: FR-001, FR-003 — route: package — deps: T006
- [x] T008 [US4] `bindSharedDocument` and `useSharedEditor` in `packages/experience/builder/src/react/shared-editor` — covers: FR-006, P-006 — route: package — deps: T006
- [x] T009 Stand-in barrels for the three entries — covers: FR-001, P-001 — route: package — deps: T007, T008
- [x] T010 Tests beside every subject and each barrel's test — covers: SC-002, P-002, P-003, P-004, P-005, P-006 — route: tests — deps: T009
- [x] T011 Changeset `.changeset/builder-package.md`; `oxfmt`, `oxlint` and `validate-repository.mjs` clean — covers: SC-001, SC-003 — route: package — deps: T010
- [ ] T012 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002, SC-003 — route: tests — deps: T010

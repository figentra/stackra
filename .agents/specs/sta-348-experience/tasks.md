# Tasks: `@stackra/experience` wave 6

**Input**: `.agents/specs/sta-348-experience/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-experience/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/experience/experience` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `Renderer`, `DocumentNode`, `BlockEvent`, `BlockEventHandlers`, `RenderContext` in `src/contracts/`; `Block`, `BlockCategory`, `BlockClass`, `BlockOptions`, `BlockProps`, `LocalizedText` in `src/core/` — covers: FR-002, P-002 — route: package — deps: T002
- [x] T004 [US2] `registerBlocks`, `BLOCK_ENTRIES`, `BlockEntry` in `src/core/` — covers: FR-003, P-003 — route: package — deps: T003
- [x] T005 [US2] `resolveDocument`, `localizeValue`, `textIn`, `ResolvedNode`, `UnknownBlockError`, `InvalidDocumentError` in `src/core/` — covers: FR-004, P-004 — route: package — deps: T004
- [x] T006 [US3] `ReactRendererDriver`, `BlockNode`, `DocumentRenderer` with its Props in `src/react/`; `NativeRendererDriver`, `BlockNode`, `DocumentRenderer` with its Props and the native `BlockProps` in `src/native/`; `dispatchBlockEvent` in `src/core/` — covers: FR-005, P-005, FR-002 — route: package — deps: T005
- [x] T007 [US1] Stand-in barrels for the four entries — covers: FR-001, FR-002 — route: package — deps: T006
- [x] T008 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T007
- [x] T009 [US1] Changeset `.changeset/experience-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T008
- [ ] T010 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T009
- [x] T011 [US1] R3 reconciliation: `registeredBlocks()` in `packages/experience/experience/src/core/functions/registered-blocks.function.ts` and the optional `DocumentNode.id` in `src/contracts/types/document-node.type.ts` — covers: FR-003, FR-004 — route: package — deps: T009

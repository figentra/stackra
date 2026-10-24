# Tasks: `@stackra/mcp` wave 2

**Input**: `.agents/specs/sta-348-mcp/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-mcp/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, LICENSE) in `packages/developer/mcp` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] Config schema, rules, parse, render and JSON Schema in `src/core/` — covers: FR-002 — route: package — deps: T002
- [x] T004 [US2] `secretNamesOf`, `shellCommandLine`, `mcpExecCommand` in `src/core/`; `execWithSecrets` in `src/node/` — covers: FR-002, FR-003, FR-005 — route: package — deps: T002
- [x] T005 [US1] `readMcpConfig`, `syncMcpConfig`, `checkMcpConfig` in `src/node/` — covers: FR-003 — route: package — deps: T003
- [x] T006 [US3] `connectMcp`, `openEncoreMcp`, `readManifests`, `spawnStackra`, `serveLocalMcp` in `src/node/` — covers: FR-003, FR-004 — route: package — deps: T002
- [x] T007 [US1, US2, US3] Tests beside every public symbol (`__tests__/`) — covers: SC-002 — route: tests — deps: T006
- [x] T008 [US1] Changeset `.changeset/mcp-package.md` — covers: SC-001 — route: package — deps: T006
- [ ] T009 [US1, US2, US3] Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-003 — route: tests — deps: T007

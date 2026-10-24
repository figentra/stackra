# Tasks: `@stackra/cli` wave 3

**Input**: `.agents/specs/sta-348-cli/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-cli/` — covers: SC-001 — route: spec-draft
- [x] T002 [US5] Member files (`package.json` with `bin`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/developer/cli` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US5] Command core: `CliCommand`, `CliContext`, `CliIo`, `findCommand`, `helpText`, `runCli`, `captureIo`, `cliVersion`, `PROCESS_IO`, `CliUsageError`, the binary — covers: FR-001 — route: package — deps: T002
- [x] T004 [US1] `runGen`, `workspaceMembers`, `GEN_COMMAND` — covers: FR-002 — route: package — deps: T003
- [x] T005 [US2] `readMember`, `resolveTool`, `runProcess`, `toolCommand` and the six tool commands in `COMMANDS` — covers: FR-004 — route: package — deps: T004
- [x] T006 [US3] `MANIFEST_IDENTITIES`, `LS_COMMAND` — covers: SC-002 — route: package — deps: T003
- [x] T007 [US4] `MCP_COMMAND`, `MCP_SYNC_COMMAND`, `MCP_EXEC_COMMAND`, `AGENTS_SYNC_COMMAND`, `AGENTS_CHECK_COMMAND` — covers: FR-003, FR-005 — route: package — deps: T003
- [x] T008 [US1–US5] Tests beside every public symbol (`packages/developer/cli/src/**/__tests__/`) — covers: SC-002 — route: tests — deps: T007
- [x] T009 [US1] Changeset `.changeset/cli-package.md` — covers: SC-001 — route: package — deps: T007
- [ ] T010 [US1–US5] Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-003 — route: tests — deps: T008
- [ ] T011 `stackra db migrate|diff|seed|rollback` after `@stackra/database` (data wave, ADR 0159 note) — covers: FR-001 — route: package

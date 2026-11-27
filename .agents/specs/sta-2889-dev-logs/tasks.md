---
description: "Tasks for STA-2889: a dev log stackra dev writes, and the logs, last_error and browser_logs MCP tools"
---

# Tasks: a dev log `stackra dev` writes, and the `logs`, `last_error` and `browser_logs` MCP tools

**Input**: Design documents from `.agents/specs/sta-2889-dev-logs/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The dev log

**Goal**: one writer that redacts, cuts and rotates; one reader.

- [x] T001 Test first: path, redaction, cut, rotation and reader in `packages/developer/runway/src/node/functions/__tests__/append-dev-log.function.test.ts`, and the export lists in `packages/developer/runway/src/core/__tests__/index.test.ts` and `packages/developer/runway/src/node/__tests__/index.test.ts` — covers: FR-003, FR-004, P-001, P-002, AC-002, EC-01, EC-03 — route: tests
- [x] T002 The dev log in `packages/developer/runway/src/core/constants/dev-log-path.constant.ts`, `packages/developer/runway/src/core/constants/dev-log-max-bytes.constant.ts`, `packages/developer/runway/src/core/constants/dev-log-max-text.constant.ts`, `packages/developer/runway/src/core/types/dev-log-entry.type.ts`, `packages/developer/runway/src/node/functions/dev-log-file.function.ts`, `packages/developer/runway/src/node/functions/append-dev-log.function.ts`, `packages/developer/runway/src/node/functions/read-dev-log.function.ts` and `packages/developer/runway/src/node/functions/rotated-dev-log.function.ts`, exported from `packages/developer/runway/src/core/index.ts` and `packages/developer/runway/src/node/index.ts`, with `@stackra/logger` in `packages/developer/runway/package.json` and `packages/developer/vite-plugin/package.json` and `pnpm-lock.yaml` — covers: FR-003, FR-004, P-001, P-002, AC-002 — route: package — deps: T001

## Phase 2: User Story 1 - The server's output in a file (Priority: P1)

**Goal**: `stackra dev` tees its tool's output into the dev log.

**Independent Test**: `toolCommand("dev")` with a fake process.

- [x] T003 [US1] Test first: line levels, the tee and the piped run in `packages/developer/cli/src/node/functions/__tests__/dev-log-entry-of.function.test.ts`, `packages/developer/cli/src/node/functions/__tests__/dev-log-tee.function.test.ts`, `packages/developer/cli/src/node/functions/__tests__/run-process.function.test.ts` and `packages/developer/cli/src/node/functions/__tests__/tool-command.function.test.ts` — covers: FR-001, FR-002, P-003, P-004, AC-001, EC-02, EC-06 — route: tests — deps: T002
- [x] T004 [US1] The tee in `packages/developer/cli/src/node/functions/dev-log-entry-of.function.ts`, `packages/developer/cli/src/node/functions/dev-log-tee.function.ts` and `packages/developer/cli/src/node/types/dev-log-tee.type.ts`; the piped run in `packages/developer/cli/src/node/functions/run-process.function.ts` and `packages/developer/cli/src/node/types/tool-run.type.ts`; the wiring in `packages/developer/cli/src/node/functions/tool-command.function.ts` — covers: FR-001, FR-002, P-003, P-004, AC-001 — route: package — deps: T003

## Phase 3: User Story 2 - The page's errors in the same log (Priority: P1)

**Goal**: the preset reports page errors in dev, same-origin only.

**Independent Test**: the plugin's middleware and the client script.

- [x] T005 [US2] Test first: the client, the entries, the refusal and the middleware in `packages/developer/vite-plugin/src/core/functions/__tests__/browser-log-client.function.test.ts`, `packages/developer/vite-plugin/src/core/functions/__tests__/browser-log-entries.function.test.ts` and `packages/developer/vite-plugin/src/core/functions/__tests__/browser-logs-plugin.function.test.ts`; the plugin lists in `packages/developer/vite-plugin/src/core/functions/__tests__/core-plugins.function.test.ts`, `packages/developer/vite-plugin/src/core/functions/__tests__/stackra.function.test.ts`, `packages/developer/vite-plugin/src/core/functions/__tests__/vite-config.function.test.ts` and `packages/developer/vite-plugin/src/core/functions/__tests__/bundle-config.function.test.ts` — covers: FR-005, FR-006, P-005, P-006, P-011, AC-003, EC-04 — route: tests — deps: T002
- [x] T006 [US2] The plugin in `packages/developer/vite-plugin/src/core/constants/browser-log-route.constant.ts`, `packages/developer/vite-plugin/src/core/constants/browser-log-limits.constant.ts`, `packages/developer/vite-plugin/src/core/functions/browser-log-client.function.ts`, `packages/developer/vite-plugin/src/core/functions/browser-log-entries.function.ts`, `packages/developer/vite-plugin/src/core/functions/browser-log-refusal.function.ts` and `packages/developer/vite-plugin/src/core/functions/browser-logs-plugin.function.ts`, added in `packages/developer/vite-plugin/src/core/functions/core-plugins.function.ts` — covers: FR-005, FR-006, P-005, P-006, P-011, AC-003 — route: package — deps: T005

## Phase 4: User Story 3 - The tools (Priority: P1)

**Goal**: `logs`, `last_error` and `browser_logs` answer from the dev log.

**Independent Test**: the three tools over stdio against a fixture repository.

- [x] T007 [US3] Test first: the three tools and `parseSince` in `packages/developer/mcp/src/node/commands/__tests__/logs.command.test.ts`, `packages/developer/mcp/src/node/commands/__tests__/last-error.command.test.ts`, `packages/developer/mcp/src/node/commands/__tests__/browser-logs.command.test.ts`, the fixture `packages/developer/mcp/src/node/commands/__tests__/dev-log-repository.fixture.ts` and `packages/developer/mcp/src/node/functions/__tests__/parse-since.function.test.ts`; the tool order in `packages/developer/mcp/src/node/functions/__tests__/serve-local-mcp.function.test.ts` — covers: FR-007, FR-008, FR-009, FR-010, P-007, P-008, P-009, P-010, AC-004, EC-05, EC-07 — route: tests — deps: T002
- [x] T008 [US3] The tools in `packages/developer/mcp/src/node/commands/logs.command.ts`, `packages/developer/mcp/src/node/commands/last-error.command.ts` and `packages/developer/mcp/src/node/commands/browser-logs.command.ts`, with `packages/developer/mcp/src/node/functions/dev-log-query.function.ts`, `packages/developer/mcp/src/node/functions/parse-since.function.ts`, `packages/developer/mcp/src/node/constants/dev-log-levels.constant.ts` and `packages/developer/mcp/src/node/types/dev-log-filter.type.ts`, listed in `packages/developer/mcp/src/node/constants/dev-tool-commands.constant.ts` and the regenerated `packages/developer/mcp/stackra.manifest.json` — covers: FR-007, FR-008, FR-009, FR-010, P-007, P-008, P-009, P-010, AC-004 — route: package — deps: T007

## Phase 5: Polish

- [x] T009 Document the dev log, the plugin and the tools in `packages/developer/mcp/README.md`, `packages/developer/runway/README.md`, `packages/developer/vite-plugin/README.md`, `apps/docs/src/docs/cli.mdx`, `apps/docs/src/docs/cli.ar.mdx`, `apps/docs/src/docs/clients-and-tools.mdx`, `apps/docs/src/docs/clients-and-tools.ar.mdx` and `.changeset/dev-log-mcp-tools.md` — covers: SC-005, AC-001, AC-003, AC-004 — route: steward-docs — deps: T008
- [x] T010 Run the four packages' tests, typecheck, oxlint and oxfmt and the revert checks on box 2, in `packages/developer/runway/package.json`, `packages/developer/cli/package.json`, `packages/developer/mcp/package.json` and `packages/developer/vite-plugin/package.json` — covers: SC-001, SC-002, SC-003, SC-004, SC-005, SC-006, AC-001, AC-002, AC-003, AC-004 — route: verify-fix — deps: T009
- [x] T011 [US1] Test first, then the fix: a screen tool keeps the terminal's stdout and `--no-log` opts out, in `packages/developer/cli/src/node/types/tool-run.type.ts`, `packages/developer/cli/src/node/functions/run-process.function.ts`, `packages/developer/cli/src/node/functions/resolve-tool.function.ts` and `packages/developer/cli/src/node/functions/tool-command.function.ts`, tested in `packages/developer/cli/src/node/functions/__tests__/run-process.function.test.ts`, `packages/developer/cli/src/node/functions/__tests__/resolve-tool.function.test.ts` and `packages/developer/cli/src/node/functions/__tests__/tool-command.function.test.ts`, documented in `packages/developer/cli/README.md`, `packages/developer/mcp/README.md`, `apps/docs/src/docs/cli.mdx`, `apps/docs/src/docs/cli.ar.mdx` and `.changeset/dev-log-mcp-tools.md` — covers: FR-011, P-012, EC-08, AC-005, SC-007 — route: package — deps: T004

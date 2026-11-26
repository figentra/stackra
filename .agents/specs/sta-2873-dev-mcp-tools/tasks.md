---
description: "Tasks for STA-2873: the developer MCP describes only what exists and serves real commands as tools"
---

# Tasks: the developer MCP describes only what exists and serves real commands as tools

**Input**: Design documents from `.agents/specs/sta-2873-dev-mcp-tools/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Tool hints in the console

**Goal**: a tool command states read-only, destructive and idempotent.

- [x] T001 Test first: the resolved hints for read-only, `true` and a writing tool in `packages/developer/console/src/core/functions/__tests__/tools-of.function.test.ts` — covers: FR-007, P-005, AC-006 — route: tests
- [x] T002 Resolve and carry the hints in `packages/developer/console/src/core/functions/read-command.function.ts`, `packages/developer/console/src/core/functions/tools-of.function.ts`, `packages/developer/console/src/contracts/types/command-options.type.ts`, `packages/developer/console/src/contracts/types/command-structure.type.ts` and `packages/developer/console/src/core/types/console-tool.type.ts` — covers: FR-007, P-005, AC-006 — route: package — deps: T001

## Phase 2: User Story 1 - Only what exists (Priority: P1)

**Goal**: every tool is a command; its enums mirror the CLI.

**Independent Test**: the built-in tools against the CLI's own definitions.

- [x] T003 [US1] Test first: kinds, phases and flags against the CLI in `packages/developer/cli/src/node/constants/__tests__/mcp-command.constant.test.ts` — covers: FR-002, P-001, P-002, AC-001 — route: tests — deps: T002
- [x] T004 [US1] Replace `LOCAL_TOOLS` (delete `packages/developer/mcp/src/node/constants/local-tools.constant.ts`, `packages/developer/mcp/src/node/functions/read-manifests.function.ts` and `packages/developer/mcp/src/node/functions/__tests__/read-manifests.function.test.ts`) with the tool commands listed in `packages/developer/mcp/src/node/constants/dev-tool-commands.constant.ts`, the enums `packages/developer/mcp/src/node/constants/new-kinds.constant.ts` and `packages/developer/mcp/src/node/constants/check-phase-names.constant.ts`, the port `packages/developer/mcp/src/core/ports/dev-tool-host.port.ts` exported from `packages/developer/mcp/src/core/index.ts`, its container `packages/developer/mcp/src/node/functions/dev-tool-container.function.ts`, the `new` tool `packages/developer/mcp/src/node/commands/new.command.ts`, the node barrel `packages/developer/mcp/src/node/index.ts`, the tool type `packages/developer/mcp/src/node/types/local-tool.type.ts`, the dependencies in `packages/developer/mcp/package.json` and `pnpm-lock.yaml`, and the regenerated `packages/developer/mcp/stackra.manifest.json` — covers: FR-001, FR-002, P-006, AC-001 — route: package — deps: T003
- [x] T005 [US1] Refuse an unknown manifest section in `packages/developer/mcp/src/node/commands/manifest.command.ts` — covers: FR-003, P-007, AC-002 — route: package — deps: T004

## Phase 3: User Story 2 - Read the app (Priority: P1)

- [x] T006 [US2] `app_info` and `routes` and the member readers in `packages/developer/mcp/src/node/commands/app-info.command.ts`, `packages/developer/mcp/src/node/commands/routes.command.ts`, `packages/developer/mcp/src/node/functions/read-members.function.ts`, `packages/developer/mcp/src/node/functions/resolve-member.function.ts`, `packages/developer/mcp/src/node/types/workspace-member.type.ts` and `packages/developer/mcp/src/node/constants/local-environments.constant.ts`, tested in `packages/developer/mcp/src/node/functions/__tests__/read-members.function.test.ts` and `packages/developer/mcp/src/node/functions/__tests__/serve-local-mcp.function.test.ts` — covers: FR-004, P-006, AC-002, EC-02, EC-07 — route: package — deps: T004
- [x] T007 [US2] Declare `ls` a tool and pass it from `MCP_COMMAND` in `packages/developer/cli/src/node/commands/ls.command.ts` and `packages/developer/cli/src/node/constants/mcp-command.constant.ts` — covers: FR-004, P-006, AC-002 — route: package — deps: T004

## Phase 4: User Story 3 - Run and read results (Priority: P1)

- [x] T008 [US3] Test first: the parsers and the run helpers in `packages/developer/mcp/src/node/functions/__tests__/parse-test-output.function.test.ts`, `packages/developer/mcp/src/node/functions/__tests__/parse-diagnostics.function.test.ts`, `packages/developer/mcp/src/node/functions/__tests__/parse-gen-output.function.test.ts`, `packages/developer/mcp/src/node/functions/__tests__/parse-check-output.function.test.ts`, `packages/developer/mcp/src/node/functions/__tests__/tool-run.function.test.ts` and `packages/developer/mcp/src/node/functions/__tests__/spawn-stackra.function.test.ts` — covers: FR-005, FR-006, P-008, P-009, AC-003, EC-01, EC-03, EC-04, EC-05 — route: tests — deps: T004
- [x] T009 [US3] The runner tools `packages/developer/mcp/src/node/commands/gen.command.ts`, `packages/developer/mcp/src/node/commands/validate.command.ts`, `packages/developer/mcp/src/node/commands/check.command.ts`, `packages/developer/mcp/src/node/commands/verify.command.ts`, `packages/developer/mcp/src/node/commands/test.command.ts`, `packages/developer/mcp/src/node/commands/typecheck.command.ts` and `packages/developer/mcp/src/node/commands/lint.command.ts`; the helpers `packages/developer/mcp/src/node/functions/run-tool-command.function.ts`, `packages/developer/mcp/src/node/functions/tool-run.function.ts`, `packages/developer/mcp/src/node/functions/check-report.function.ts`, `packages/developer/mcp/src/node/functions/diagnostics-of.function.ts`, `packages/developer/mcp/src/node/functions/parse-test-output.function.ts`, `packages/developer/mcp/src/node/functions/parse-diagnostics.function.ts`, `packages/developer/mcp/src/node/functions/parse-gen-output.function.ts`, `packages/developer/mcp/src/node/functions/parse-check-output.function.ts` and `packages/developer/mcp/src/node/constants/output-limit.constant.ts`; the types `packages/developer/mcp/src/node/types/diagnostic.type.ts`, `packages/developer/mcp/src/node/types/test-summary.type.ts` and `packages/developer/mcp/src/node/types/tool-run-result.type.ts`; the member folder in `packages/developer/mcp/src/node/functions/spawn-stackra.function.ts`, `packages/developer/mcp/src/node/types/stackra-runner.type.ts`, `packages/developer/cli/src/node/functions/run-cli.function.ts` and `packages/developer/cli/src/node/types/cli-context.type.ts` — covers: FR-005, FR-006, P-008, P-009, AC-003 — route: package — deps: T008

## Phase 5: User Stories 4 and 5 - Guarded writes, every Encore tool (Priority: P1, P2)

- [x] T010 [US4] Refuse writes on a deployed target and list the hints in `packages/developer/mcp/src/node/functions/serve-local-mcp.function.ts`, `packages/developer/mcp/src/node/functions/deployed-target.function.ts` and `packages/developer/mcp/src/node/types/serve-local-mcp-options.type.ts`, tested in `packages/developer/mcp/src/node/functions/__tests__/deployed-target.function.test.ts` — covers: FR-007, FR-008, P-003, AC-004, AC-006, EC-06 — route: package — deps: T009
- [x] T011 [US5] Follow `nextCursor` in `packages/developer/mcp/src/node/functions/list-upstream-tools.function.ts` with `packages/developer/mcp/src/node/types/upstream-tool.type.ts`, tested in `packages/developer/mcp/src/node/functions/__tests__/list-upstream-tools.function.test.ts` — covers: FR-009, P-004, AC-005 — route: package — deps: T010

## Phase 6: Polish

- [x] T012 Document the tools, hints and the deployed-target refusal in `packages/developer/mcp/README.md`, `packages/developer/mcp/AGENTS.md`, `apps/docs/src/docs/cli.mdx`, `apps/docs/src/docs/cli.ar.mdx`, `apps/docs/src/docs/clients-and-tools.mdx`, `apps/docs/src/docs/clients-and-tools.ar.mdx` and `.changeset/dev-mcp-truthful-tools.md` — covers: SC-004, AC-001, AC-003 — route: steward-docs — deps: T011
- [ ] T013 Run the three packages' tests, typecheck, oxlint and oxfmt, the revert checks and the stdio proof, in `packages/developer/mcp/package.json` — covers: SC-001, SC-002, SC-003, SC-004, SC-005, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — route: verify-fix — deps: T012

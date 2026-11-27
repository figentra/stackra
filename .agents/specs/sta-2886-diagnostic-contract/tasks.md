---
description: "Tasks for STA-2886: one Diagnostic contract for every local MCP tool result, with the full log on disk"
---

# Tasks: one Diagnostic contract for every local MCP tool result, with the full log on disk

**Input**: Design documents from `.agents/specs/sta-2886-diagnostic-contract/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The contract

**Goal**: one finding shape every tool and command can name.

- [x] T001 Test first: the fields and their optionality in `packages/developer/console/src/contracts/types/__tests__/diagnostic.type.test.ts`, then `packages/developer/console/src/contracts/types/diagnostic.type.ts`, `packages/developer/console/src/contracts/types/diagnostic-report.type.ts` and the barrel `packages/developer/console/src/contracts/index.ts` — covers: FR-001, AC-001 — route: package

## Phase 2: User Story 1 - One list (Priority: P1)

**Goal**: every reader of tool output returns diagnostics.

**Independent Test**: the parser and mapper tests.

- [x] T002 [US1] Test first, then the readers: `packages/developer/mcp/src/node/functions/parse-diagnostics.function.ts`, `packages/developer/mcp/src/node/functions/parse-gen-output.function.ts`, `packages/developer/mcp/src/node/functions/test-diagnostics.function.ts`, `packages/developer/mcp/src/node/functions/check-diagnostics.function.ts`, `packages/developer/mcp/src/node/functions/check-report.function.ts`, `packages/developer/mcp/src/node/functions/diagnostics-of.function.ts`, deleting `packages/developer/mcp/src/node/types/diagnostic.type.ts` and its export in `packages/developer/mcp/src/node/index.ts`; tests in `packages/developer/mcp/src/node/functions/__tests__/parse-diagnostics.function.test.ts`, `packages/developer/mcp/src/node/functions/__tests__/parse-gen-output.function.test.ts`, `packages/developer/mcp/src/node/functions/__tests__/test-diagnostics.function.test.ts` and `packages/developer/mcp/src/node/functions/__tests__/parse-check-output.function.test.ts` — covers: FR-001, FR-003, P-002, AC-002, EC-02, EC-04 — route: package — deps: T001
- [x] T003 [US1] The tool commands read diagnostics: `packages/developer/mcp/src/node/commands/test.command.ts`, `packages/developer/mcp/src/node/commands/typecheck.command.ts`, `packages/developer/mcp/src/node/commands/lint.command.ts`, `packages/developer/mcp/src/node/commands/gen.command.ts`, `packages/developer/mcp/src/node/commands/check.command.ts`, `packages/developer/mcp/src/node/commands/verify.command.ts` and `packages/developer/mcp/src/node/commands/validate.command.ts` — covers: FR-003, AC-002 — route: package — deps: T002

## Phase 3: User Stories 2 and 3 - Never empty, the log on disk (Priority: P1)

- [x] T004 [US2] [US3] Test first, then the run: `packages/developer/mcp/src/node/functions/run-tool-command.function.ts`, `packages/developer/mcp/src/node/functions/write-tool-log.function.ts`, `packages/developer/mcp/src/node/constants/tool-log-dir.constant.ts` and `packages/developer/mcp/src/node/types/tool-run-result.type.ts`, tested in `packages/developer/mcp/src/node/functions/__tests__/tool-run.function.test.ts` and `packages/developer/mcp/src/node/functions/__tests__/write-tool-log.function.test.ts` — covers: FR-004, FR-005, P-002, P-003, P-004, AC-003, AC-004, EC-01, EC-03, EC-05 — route: package — deps: T003

## Phase 4: User Story 4 - The result and its links (Priority: P1, P2)

- [x] T005 [US4] Test first, then `packages/developer/mcp/src/node/functions/tool-result.function.ts`, `packages/developer/mcp/src/node/functions/explain-docs.function.ts` and their use in `packages/developer/mcp/src/node/functions/serve-local-mcp.function.ts`, tested in `packages/developer/mcp/src/node/functions/__tests__/tool-result.function.test.ts`, `packages/developer/mcp/src/node/functions/__tests__/explain-docs.function.test.ts` and `packages/developer/mcp/src/node/functions/__tests__/serve-local-mcp.function.test.ts` — covers: FR-002, FR-006, P-001, P-005, AC-002, AC-005 — route: package — deps: T004

## Phase 5: Polish

- [x] T006 Document the result shape, the log and the links in `packages/developer/mcp/README.md`, `packages/developer/mcp/AGENTS.md`, `apps/docs/src/docs/clients-and-tools.mdx`, `apps/docs/src/docs/clients-and-tools.ar.mdx`, `.changeset/diagnostic-contract.md` and the regenerated `packages/developer/mcp/stackra.manifest.json` — covers: SC-004, AC-002 — route: steward-docs — deps: T005
- [x] T007 Run the two packages' tests, typecheck, oxlint and oxfmt, the revert check and `fflow gate ci` — covers: SC-001, SC-002, SC-003, SC-004, AC-001, AC-002, AC-003, AC-004, AC-005 — route: verify-fix — deps: T006

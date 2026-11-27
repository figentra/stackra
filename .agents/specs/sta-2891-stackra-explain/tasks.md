---
description: "Tasks for STA-2891: stackra explain <code>, and a docs link on every gen and command error"
---

# Tasks: `stackra explain <code>`, and a docs link on every gen and command error

**Input**: Design documents from `.agents/specs/sta-2891-stackra-explain/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Foundational - the catalogue copy

- [x] T001 `ErrorCodeEntry`, `ERROR_CODES_PAGE`, `errorCodeEntry` and `errorCodeDocs` in `packages/developer/gen/src/core/types/error-code-entry.type.ts`, `packages/developer/gen/src/core/constants/error-codes-page.constant.ts`, `packages/developer/gen/src/core/functions/error-code-entry.function.ts` and `packages/developer/gen/src/core/functions/error-code-docs.function.ts` — covers: FR-003, EC-01, EC-02, AC-001, AC-002 — route: spec-task
- [x] T002 the writer and the written copy in `apps/docs/scripts/error-codes/heading-anchors.ts`, `apps/docs/scripts/error-codes/catalogue-entries.ts`, `apps/docs/scripts/error-codes/render-catalogue.ts`, `apps/docs/scripts/error-codes/catalogue-paths.ts`, `apps/docs/scripts/error-codes/write-catalogue.ts`, `apps/docs/package.json` and `packages/developer/gen/src/core/constants/error-codes.constant.ts` — covers: FR-001, FR-002, EC-04, AC-005, P-001, P-002 — route: spec-task — deps: T001
- [x] T003 the guard in `apps/docs/scripts/error-codes/__tests__/catalogue.test.ts` and the scanner's skip in `apps/docs/scripts/error-codes/source-files.ts` — covers: FR-006, AC-005, SC-001, P-001, P-002 — route: tests — deps: T002

## Phase 2: User Story 2 - Every finding and error links to the docs (Priority: P1)

- [x] T004 [US2] the docs line in `packages/developer/gen/src/core/functions/format-gen-error.function.ts`, the exports in `packages/developer/gen/src/core/index.ts`, and tests in `packages/developer/gen/src/core/functions/__tests__/format-gen-error.function.test.ts`, `packages/developer/gen/src/core/functions/__tests__/error-code-docs.function.test.ts` and `packages/developer/gen/src/core/__tests__/index.test.ts` — covers: FR-003, AC-002, P-003 — route: spec-task — deps: T001
- [x] T005 [US2] the console's fallback docs link in `packages/developer/console/src/core/types/console-config.type.ts` and `packages/developer/console/src/core/functions/create-console.function.ts`, tested in `packages/developer/console/src/core/functions/__tests__/create-console.function.test.ts` — covers: FR-007, AC-003, P-004 — route: spec-task
- [x] T006 [US2] the troubleshooting fallback in `packages/developer/cli/src/node/constants/troubleshooting-docs.constant.ts` and `packages/developer/cli/src/node/functions/run-cli.function.ts`, tested in `packages/developer/cli/src/node/functions/__tests__/run-cli.function.test.ts` — covers: FR-007, AC-003 — route: spec-task — deps: T005

## Phase 3: User Story 1 and 3 - `stackra explain` and its MCP tool

- [x] T007 [US1] `ExplainCommand`, `findErrorCode` and `closestCodes` in `packages/developer/cli/src/node/commands/explain.command.ts`, `packages/developer/cli/src/node/explain/functions/find-error-code.function.ts` and `packages/developer/cli/src/node/explain/functions/closest-codes.function.ts`, listed in `packages/developer/cli/src/node/constants/commands.constant.ts` and `packages/developer/cli/stackra.manifest.json` — covers: FR-004, FR-008, NFR-001, AC-001, AC-006, AC-007, EC-01, EC-03, P-005, P-007 — route: spec-task — deps: T004
- [x] T008 [US3] the MCP tool in `packages/developer/cli/src/node/constants/mcp-command.constant.ts` — covers: FR-005, AC-004, P-006 — route: spec-task — deps: T007
- [x] T009 tests in `packages/developer/cli/src/node/commands/__tests__/explain.command.test.ts`, `packages/developer/cli/src/node/explain/functions/__tests__/closest-codes.function.test.ts`, `packages/developer/cli/src/node/explain/functions/__tests__/find-error-code.function.test.ts` and `packages/developer/cli/src/node/constants/__tests__/mcp-command.constant.test.ts` — covers: FR-004, FR-005, FR-008, AC-001, AC-004, AC-006, AC-007, P-005, P-006, P-007 — route: tests — deps: T007, T008

## Phase 4: Polish

- [x] T010 [P] docs in `apps/docs/src/docs/customers/error-codes.mdx`, `apps/docs/src/docs/customers/troubleshooting.mdx`, `apps/docs/src/docs/cli.mdx`, `apps/docs/AGENTS.md` and `packages/developer/cli/README.md` — covers: FR-001, FR-004, AC-001, AC-006 — route: steward-docs — deps: T007
- [x] T011 [P] changeset for gen, cli and console in `.changeset/stackra-explain-error-codes.md` — covers: FR-003, FR-004, FR-007, AC-001, AC-002, AC-003 — route: steward-changesets — deps: T007

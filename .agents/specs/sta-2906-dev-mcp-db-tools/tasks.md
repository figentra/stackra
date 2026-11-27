---
description: "Tasks for STA-2906: tenant-aware database inspections for the dev MCP, and one Encore path"
---

# Tasks: tenant-aware database inspections for the dev MCP, and one Encore path

**Input**: Design documents from `.agents/specs/sta-2906-dev-mcp-db-tools/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Foundational - the inspection session and its guard

- [x] T001 the limits, the refusal and the environment and host guard in `packages/data/database/src/node/constants/inspection-limits.constant.ts`, `packages/data/database/src/node/errors/inspection-refused.error.ts` and `packages/data/database/src/node/functions/inspection-target.function.ts` — covers: FR-008, NFR-002, AC-004, P-004 — route: spec-task
- [x] T002 the read-only, always rolled back session with an extended-protocol runner in `packages/data/database/src/node/functions/open-inspection-session.function.ts`, `packages/data/database/src/node/types/inspection-session.type.ts` and `packages/data/database/src/node/types/inspection-row.type.ts` — covers: FR-004, NFR-001, P-002, P-003 — route: spec-task — deps: T001

## Phase 2: User Story 1 - An agent reads a tenant's rows as the app does (Priority: P1)

**Goal**: `queryInScope` and `stackra db:query` / `db_query`.

**Independent Test**: `database-inspection.int.test.ts` on a FORCE ROW LEVEL SECURITY table.

- [x] T003 [US1] input checks and the query in `packages/data/database/src/node/functions/scoped-query-input.function.ts`, `packages/data/database/src/node/functions/query-in-scope.function.ts`, `packages/data/database/src/node/types/scoped-query.type.ts` `packages/data/database/src/node/types/scoped-query-result.type.ts`, with the ADR 0495 allow-list entry in `packages/developer/cli/src/node/session-settings/constants/session-setting-allowed.constant.ts` and its test `packages/developer/cli/src/node/session-settings/functions/__tests__/session-settings.test.ts` — covers: FR-004, FR-005, NFR-003, AC-001, AC-002, AC-003, P-001 — route: spec-task — deps: T002
- [x] T004 [US1] the command and its setup in `packages/developer/cli/src/node/commands/db-query.command.ts`, `packages/developer/cli/src/node/functions/inspection-setup.function.ts`, `packages/developer/cli/src/node/functions/load-database-inspector.function.ts`, `packages/developer/cli/src/node/functions/import-member-database.function.ts`, `packages/developer/cli/src/node/functions/load-database-runner.function.ts` and `packages/developer/cli/src/node/types/database-inspector.type.ts` — covers: FR-001, FR-003, FR-008, AC-007 — route: spec-task — deps: T003
- [x] T005 [US1] tests in `packages/data/database/src/node/functions/__tests__/database-inspection.int.test.ts`, `packages/data/database/src/node/functions/__tests__/scoped-query-input.function.test.ts`, `packages/data/database/src/node/functions/__tests__/inspection-target.function.test.ts`, `packages/developer/cli/src/node/commands/__tests__/db-query.command.test.ts`, `packages/developer/cli/src/node/functions/__tests__/inspection-setup.function.test.ts` and `packages/developer/cli/src/node/functions/__tests__/load-database-inspector.function.test.ts` — covers: AC-001, AC-002, AC-003, AC-004, SC-001, SC-002 — route: tests — deps: T004

## Phase 3: User Story 2 - An agent sees the schema and the migration state (Priority: P2)

**Goal**: `describeSchema`, `migrationStatus` and their commands and tools.

**Independent Test**: the `describeSchema` and `migrationStatus` cases of `database-inspection.int.test.ts`.

- [x] T006 [US2] the inspections in `packages/data/database/src/node/functions/describe-schema.function.ts`, `packages/data/database/src/node/functions/migration-status.function.ts` and their types in `packages/data/database/src/node/types/` — covers: FR-006, FR-007, AC-005, AC-006 — route: spec-task — deps: T002
- [x] T007 [US2] the commands in `packages/developer/cli/src/node/commands/db-schema.command.ts` and `packages/developer/cli/src/node/commands/db-migrations-status.command.ts`, with tests beside them — covers: FR-001, FR-003, AC-007 — route: spec-task — deps: T006, T004
- [x] T008 [US2] the tools and the command list in `packages/developer/cli/src/node/constants/mcp-command.constant.ts`, `packages/developer/cli/src/node/constants/commands.constant.ts`, `packages/developer/cli/src/node/constants/__tests__/mcp-command.constant.test.ts` and `packages/developer/cli/stackra.manifest.json` — covers: FR-002, AC-007 — route: spec-task — deps: T007

## Phase 4: User Story 3 - One Encore path (Priority: P3)

- [x] T009 [US3] the `separate_encore_server` rule in `packages/developer/mcp/src/core/functions/rule-issues.function.ts`, `packages/developer/mcp/src/core/types/mcp-issue.type.ts` and its tests — covers: FR-009, AC-008, P-005 — route: spec-task
- [x] T010 [US3] the template drops its `encore` server (stackra-template: `.mcp.yaml`, `flow.config.json`, `.flow/lock.json`, `docs/template-guide.md`) — covers: FR-010, AC-008 — route: spec-task — deps: T009

## Phase 5: Polish

- [x] T011 barrel exports in `packages/data/database/src/node/index.ts` and `packages/data/database/src/node/__tests__/index.test.ts` — covers: FR-003 — route: spec-task — deps: T003, T006
- [x] T012 [P] ADR 0334 Enforcement, READMEs and AGENTS.md in `apps/docs/src/docs/adr/0334-final-structure-review-round-up-decided-rules-without-an-adr.mdx`, `packages/data/database/README.md`, `packages/data/database/AGENTS.md` and `packages/developer/mcp/README.md` — covers: FR-009, AC-008 — route: steward-docs — deps: T009
- [x] T013 [P] changeset for the database, cli and mcp packages (`packages/data/database`, `packages/developer/cli`, `packages/developer/mcp`) in `.changeset/dev-mcp-database-inspections.md` — covers: FR-001, FR-009 — route: steward-changesets — deps: T008, T009

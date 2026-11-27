---
description: "Tasks for STA-2919: the developer MCP serves Stackra's conventions as resources and its recipes as prompts"
---

# Tasks: the developer MCP serves Stackra's conventions as resources and its recipes as prompts

**Input**: Design documents from `.agents/specs/sta-2919-mcp-resources-prompts/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Foundational

**Goal**: the shared argument check, the finish steps and the knowledge the resources and prompts read.

- [x] T001 The argument check, the finish steps and the shared types in `packages/developer/mcp/src/node/functions/arguments-of.function.ts`, `packages/developer/mcp/src/node/functions/finish-steps.function.ts`, `packages/developer/mcp/src/node/types/local-knowledge.type.ts`, `packages/developer/mcp/src/node/types/resource-contents.type.ts` and the dependency in `packages/developer/mcp/package.json` and `pnpm-lock.yaml`, tested in `packages/developer/mcp/src/node/functions/__tests__/finish-steps.function.test.ts` — covers: FR-007, P-002, AC-005 — route: package

## Phase 2: User Stories 1 and 2 - Conventions and manifests as resources (Priority: P1)

**Goal**: the resources and their reader.

**Independent Test**: `resources/list` and `resources/read` against a fixture repository.

- [x] T002 [US1] The guidelines in `packages/developer/mcp/src/node/functions/guidelines-of.function.ts`, tested in `packages/developer/mcp/src/node/functions/__tests__/guidelines-of.function.test.ts` — covers: FR-003, AC-003 — route: package — deps: T001
- [x] T003 [US2] The list and the reader in `packages/developer/mcp/src/node/functions/list-local-resources.function.ts`, `packages/developer/mcp/src/node/functions/read-local-resource.function.ts`, `packages/developer/mcp/src/node/constants/local-resource-uri.constant.ts`, `packages/developer/mcp/src/node/constants/local-resource-templates.constant.ts` and `packages/developer/mcp/src/node/types/local-resource.type.ts`, tested in `packages/developer/mcp/src/node/functions/__tests__/list-local-resources.function.test.ts` and `packages/developer/mcp/src/node/functions/__tests__/read-local-resource.function.test.ts` — covers: FR-002, FR-004, P-001, P-004, AC-002, AC-004, EC-01, EC-02 — route: package — deps: T002

## Phase 3: User Story 3 - Recipes as prompts (Priority: P1)

**Goal**: the three prompts, filled from the repository.

**Independent Test**: `prompts/list` and `prompts/get` against a fixture repository.

- [x] T004 [US3] The prompts in `packages/developer/mcp/src/node/constants/local-prompts.constant.ts`, `packages/developer/mcp/src/node/functions/get-local-prompt.function.ts`, `packages/developer/mcp/src/node/functions/prompt-arguments.function.ts` and `packages/developer/mcp/src/node/types/prompt-message.type.ts`, tested in `packages/developer/mcp/src/node/functions/__tests__/get-local-prompt.function.test.ts` — covers: FR-005, FR-006, FR-007, FR-008, P-002, P-003, AC-005, AC-006, AC-007, EC-03, EC-04, EC-05 — route: package — deps: T003

## Phase 4: The server

- [x] T005 Answer the five methods, advertise the capabilities and take `skills` in `packages/developer/mcp/src/node/functions/serve-local-mcp.function.ts` and `packages/developer/mcp/src/node/types/serve-local-mcp-options.type.ts`, tested in `packages/developer/mcp/src/node/functions/__tests__/serve-local-mcp.function.test.ts` — covers: FR-001, AC-001, AC-002, AC-005, AC-007, EC-06, SC-002 — route: package — deps: T004

## Phase 5: Polish

- [x] T006 Document the resources and prompts in `packages/developer/mcp/README.md`, `packages/developer/mcp/AGENTS.md`, `apps/docs/src/docs/cli.mdx`, `apps/docs/src/docs/cli.ar.mdx`, `apps/docs/src/docs/clients-and-tools.mdx`, `apps/docs/src/docs/clients-and-tools.ar.mdx` and `.changeset/mcp-resources-and-prompts.md` — covers: FR-001, AC-001 — route: steward-docs — deps: T005
- [x] T007 Run the package's tests, typecheck, oxlint and oxfmt, the revert check and the stdio proof, in `packages/developer/mcp/package.json` — covers: SC-001, SC-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007 — route: verify-fix — deps: T006

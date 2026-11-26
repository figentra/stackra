---
description: "Tasks for STA-1617: MCP server secrets reach the environment, never argv"
---

# Tasks: MCP server secrets reach the environment, never argv

**Input**: Design documents from `.agents/specs/sta-1617-mcp-secrets-off-argv/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: This repository's launcher

**Goal**: `mcp.sh` and `secrets-exec.mjs` never put a value on argv.

- [x] T001 Test first: every `.mcp.yaml` `mcp.sh` server gets its secrets in its environment and none on argv, the header file holds placeholders only, and a reference is refused before any decrypt in `tools/scripts/__tests__/mcp-sh.test.mjs` — covers: FR-001, FR-002, FR-004, P-001, P-002, AC-001, AC-002 — route: tests
- [x] T002 Take `--env`, refuse references and start at the repository root in `tools/scripts/mcp.sh` — covers: FR-001, FR-002, P-001, P-002, EC-01, EC-04, EC-05, AC-001, AC-002 — route: package — deps: T001
- [x] T003 Remove `--expand-args` and `expandArg` from `tools/scripts/secrets-exec.mjs` and update `tools/scripts/__tests__/secrets-exec.test.mjs` — covers: FR-003, P-003, AC-005 — route: package — deps: T001
- [x] T004 Declare each server's token with `--env`, pin the four servers and add the GitHub header placeholder in `flow.config.json` and `tools/scripts/mcp-github.headers`, then render `.mcp.yaml` with `fflow sync` — covers: FR-004, P-001, AC-001 — route: package — deps: T002

## Phase 2: User Story 3 - A template project declares its tokens (Priority: P2)

**Goal**: `stackra mcp exec --env` puts values in the server's environment only.

**Independent Test**: a real child under a fake `sops exec-env`.

- [x] T005 [US3] Test first: the built command has no expansion, references and bad names are refused, and a started server sees the value in its environment and not on argv in `packages/developer/mcp/src/core/functions/__tests__/mcp-exec-command.function.test.ts` and `packages/developer/mcp/src/node/functions/__tests__/exec-with-secrets.function.test.ts` — covers: FR-005, FR-006, P-004, P-005, EC-02, AC-003 — route: tests
- [x] T006 [US3] Add `McpExecOptions.secrets`, refuse references and bad names in `mcpExecCommand`, and pass `secrets` through `execWithSecrets` in `packages/developer/mcp/src/core/functions/mcp-exec-command.function.ts` — covers: FR-005, FR-006, P-004, P-005, AC-003 — route: package — deps: T005
- [x] T007 [US3] Add `--env` to `stackra mcp exec` with its test in `packages/developer/cli/src/node/constants/mcp-exec-command.constant.ts` — covers: FR-005, AC-003 — route: package — deps: T006

## Phase 3: User Story 2 - A wrong `.mcp.yaml` line fails loudly (Priority: P1)

- [x] T008 [US2] Report `secret_on_argv` and update the template fixture in `packages/developer/mcp/src/core/functions/rule-issues.function.ts` and its tests — covers: FR-007, P-006, AC-004 — route: package — deps: T006

## Phase 4: Polish

- [x] T009 Document `--env`, the header file and the new code in `packages/developer/mcp/README.md`, `packages/developer/cli/README.md`, `apps/docs/src/docs/runbooks/secrets.mdx`, `apps/docs/src/docs/runbooks/token-rotation.mdx`, the secrets rules and `.changeset/mcp-secrets-off-argv.md` — covers: SC-001, SC-002, AC-001, AC-003, AC-004 — route: steward-docs — deps: T008
- [x] T010 Run the `@stackra/mcp` and `@stackra/cli` tests, typecheck, oxlint and oxfmt, and the `tools/scripts` tests, in `packages/developer/mcp/package.json` — covers: SC-001, SC-002, SC-003, AC-001, AC-002, AC-003, AC-004, AC-005 — route: verify-fix — deps: T009
- [ ] T011 Migrate the template's `context7` line to `stackra mcp exec --env CONTEXT7_API_KEY --` after the `@stackra/cli` release in `stackra-template/.mcp.yaml` — covers: SC-003, AC-003 — route: package — deps: T010

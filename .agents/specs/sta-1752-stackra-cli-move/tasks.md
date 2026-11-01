# Tasks: the 16 stackra rows of ADR 0500 move into @stackra/cli

**Input**: `.agents/specs/sta-1752-stackra-cli-move/`

## Phase 1: Spec

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-1752-stackra-cli-move/` — covers: FR-001 — route: spec-draft

## Phase 2: The move on current main

- [x] T002 Cherry-pick `ae232122` onto `3fa57cd6`; resolve `packages/developer/cli/src/node/constants/commands.constant.ts`, `packages/developer/cli/README.md` and `tools/scripts/README.md` — covers: FR-001, FR-002, FR-004, FR-006, P-001, P-002, P-004, P-006 — route: package — deps: T001 [STA-1752]
- [x] T003 Session-setting check in `packages/developer/cli/src/node/session-settings/` with its test; `validate-command.constant.ts` runs it; `tools/scripts/session-settings.mjs` removed — covers: FR-003, P-003 — route: package — deps: T002 [STA-1752]
- [x] T004 Callers and mentions: rules, `AGENTS.md`, docs pages, tenancy AGENTS.md, scaffold README — covers: FR-005, P-005 — route: steward-docs — deps: T002 [STA-1752]

## Phase 3: Box

- [ ] T005 On a box: CLI typecheck and tests, `pnpm format`, `pnpm validate`, `pnpm agents:check`, the parity run of decision 7 — covers: P-002, P-003, P-004 — route: tests — deps: T003, T004 [STA-1752]

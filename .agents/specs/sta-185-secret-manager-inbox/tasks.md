# Tasks: Secret-manager agent and the secrets inbox

**Input**: `.agents/specs/sta-185-secret-manager-inbox/`

## Phase 1: User Story 1 - Hand over a secret without pasting it

- [x] T001 [US1] Importer in `tools/scripts/secrets-import.mjs` and `secrets:import` in `package.json` — covers: FR-001, FR-002, FR-003, FR-005, P-001, P-002, P-003, P-005, EC-01 — route: spec-task
- [x] T002 [US1] Tests in `tools/scripts/__tests__/secrets-import.test.mjs` — covers: FR-001, FR-002, FR-003, FR-005, P-001, P-002, P-003, P-005 — route: tests — deps: T001
- [x] T003 [US1] Agent `.agents/agents/secret-manager.md`, rule `.agents/rules/secrets.md`, runbook `apps/docs/src/docs/runbooks/secrets.mdx` and ADR `apps/docs/src/docs/adr/0257-secret-manager-agent-and-the-secrets-inbox.mdx` — covers: SC-001 — route: spec-task — deps: T001

## Phase 2: User Story 2 - Agents stay out of the inbox

- [x] T004 [US2] Guards in `.agents/hooks/_inbox.mjs`, `.agents/hooks/guard-bash.mjs`, `.agents/hooks/guard-paths.mjs`, `.opencode/plugins/guard/decide.ts` and `.claude/settings.json` — covers: FR-004, P-004 — route: spec-task
- [x] T005 [US2] Tests in `.agents/hooks/__tests__/guard-paths.test.mjs` and `.agents/hooks/__tests__/guard-bash.test.mjs` — covers: FR-004, P-004 — route: tests — deps: T004

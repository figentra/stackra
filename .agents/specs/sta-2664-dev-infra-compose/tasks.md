# Tasks: stackra dev runs the dev compose of environments.dev.infra

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2664

- [x] T001 the kind table, the planner and their types, with tests, in `packages/developer/runway/src/core/constants/dev-infra-kinds.constant.ts`, `packages/developer/runway/src/core/functions/dev-compose-of.function.ts`, `packages/developer/runway/src/core/functions/__tests__/dev-compose-of.function.test.ts` — covers: FR-001, FR-002, FR-003, FR-004, AC-001, AC-002, AC-003, AC-004, AC-005, P-001, P-002, P-003 — route: spec-task
- [x] T002 the infra addresses in the dev facts, with tests, in `packages/developer/runway/src/node/functions/write-dev-facts.function.ts`, `packages/developer/runway/src/node/functions/__tests__/write-dev-facts.function.test.ts` — covers: FR-008, AC-010 — route: spec-task — deps: T001
- [x] T003 the runway exports and their test in `packages/developer/runway/src/core/index.ts`, `packages/developer/runway/src/core/__tests__/index.test.ts` — covers: FR-001 — route: spec-task — deps: T001
- [x] T004 writing and starting the dev compose, the state and the member variables, with tests, in `packages/developer/cli/src/node/dev-infra/` — covers: FR-005, FR-006, FR-007, AC-006, AC-007, AC-008, P-004, P-005 — route: spec-task — deps: T001
- [x] T005 the `--infra` and `--no-infra` flags and the variable layer, with tests, in `packages/developer/cli/src/node/dev-surface/constants/dev-command.constant.ts`, `packages/developer/cli/src/node/functions/tool-command.function.ts` and their tests — covers: FR-005, FR-007, AC-009 — route: spec-task — deps: T004
- [x] T006 the compose-provided names in `packages/developer/cli/src/node/commands/dev-secrets-init.command.ts` and its test — covers: FR-009 — route: spec-task — deps: T004
- [x] T007 the docs (both READMEs, the root runway schema and its byte copy) and the changesets `.changeset/runway-dev-compose.md`, `.changeset/cli-dev-compose.md` — covers: FR-001, FR-005 — route: spec-task — deps: T005
- [x] T008 the real-container proof on box 2's `stackra-demo` (Valkey, SeaweedFS, Mailpit; the real cache and S3 drivers) — covers: SC-002 — route: spec-task — deps: T005

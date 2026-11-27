# Tasks: stackra dev runs a product end to end

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2840

- [x] T001 the dev lane and the infra ports in the facts, in `packages/developer/runway/src/core/functions/dev-lane.function.ts`, `packages/developer/runway/src/node/functions/write-dev-facts.function.ts` — covers: AC-005, P-005 — route: spec-task
- [x] T002 the local monolith app, in `packages/developer/runway/src/node/functions/sync-dev-encore-app.function.ts`, `packages/developer/runway/src/node/functions/sync-dev-encore-member.function.ts` — covers: AC-001, P-001 — route: spec-task — deps: T001
- [x] T003 the root run, its plan, watch, forwards and data step, in `packages/developer/cli/src/node/dev-root/functions/run-dev-root.function.ts` — covers: AC-001, AC-002, AC-003, AC-004, AC-007, P-001, P-002, P-003, P-004, P-007 — route: spec-task — deps: T002
- [x] T004 the dispatch, the lane-aware doctor and the Worker port, in `packages/developer/cli/src/node/dev-surface/constants/dev-command.constant.ts`, `packages/developer/cli/src/node/doctor/functions/read-doctor-workspace.function.ts`, `packages/developer/cli/src/node/functions/resolve-tool.function.ts` — covers: AC-005, AC-006, P-005, P-006 — route: spec-task — deps: T003
- [x] T005 a service's seed build and the ledger schema, in `packages/developer/cli/src/node/functions/run-db-seed.function.ts`, `packages/data/database/src/node/functions/seeder-ledger.function.ts` — covers: AC-008, P-008 — route: spec-task
- [x] T006 the docs and the changesets, in `apps/docs/src/docs/cli.mdx`, `.changeset/dev-root-one-encore-app.md` — covers: AC-001, AC-004 — route: spec-task — deps: T005
- [x] T007 the CTO conditions: loopback-only forwards asserted on the bound addresses, the data step refuses a database that is not on this machine, the compatibility section, in `packages/developer/cli/src/node/dev-root/functions/start-port-forward.function.ts`, `packages/developer/cli/src/node/dev-root/functions/is-local-database-url.function.ts`, `packages/developer/cli/src/node/dev-root/functions/prepare-dev-data.function.ts` — covers: AC-009, AC-010 — route: spec-task — deps: T003

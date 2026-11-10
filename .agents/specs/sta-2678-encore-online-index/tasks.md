# Tasks: Encore's migration copy builds online indexes in its one transaction

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2678

- [x] T001 the helper and its test in `packages/developer/gen/src/core/functions/encore-migration-sql.function.ts`, `packages/developer/gen/src/core/functions/__tests__/encore-migration-sql.function.test.ts` — covers: AC-001, AC-002, P-001, P-002 — route: spec-task
- [x] T002 the Encore copy reads it, in `packages/developer/gen/src/node/functions/generate.function.ts` — covers: AC-001, AC-002 — route: spec-task — deps: T001
- [x] T003 the ADR 0159 amendment in `apps/docs/src/docs/adr/0159-migrations-gen-ordered-sql-and-safety-rules.mdx` — covers: AC-003 — route: spec-task
- [x] T004 the changeset in `.changeset/gen-encore-online-index.md` — covers: AC-001 — route: spec-task — deps: T002

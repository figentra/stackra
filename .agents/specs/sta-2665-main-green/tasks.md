# Tasks: main's Quality Gate passes: TSDoc blocks, a typecheck cap and tsconfig without baseUrl

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2665

- [x] T001 the 52 docblocks in the demos, ai, notifications, database, ui, gen and repo-checks, in `packages/developer/gen/src/core/types/seeder-row.type.ts`, `packages/developer/repo-checks/src/node/constants/layout-templates.constant.ts` and the files the plan lists — covers: AC-001, P-001 — route: spec-task
- [x] T002 the Typecheck concurrency cap in `.github/workflows/ci.yml` — covers: AC-002, P-002 — route: spec-task
- [x] T003 the service check and encore:prepare without baseUrl, with their tests, the two services, ADR 0091 and the changeset, in `packages/developer/repo-checks/src/node/functions/check-encore-service.function.ts`, `packages/developer/cli/src/node/functions/prepare-encore-service.function.ts`, `services/example/tsconfig.json`, `services/health/tsconfig.json`, `.changeset/encore-paths-without-baseurl.md` — covers: AC-003, P-003 — route: spec-task

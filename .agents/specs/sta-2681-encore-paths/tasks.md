# Tasks: a service's tsconfig paths give Encore one `./` target per key, and its typecheck reads no paths

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2681

- [x] T001 one target per key, with tests, in `packages/developer/repo-checks/src/node/functions/paths-of-imports.function.ts`, `packages/developer/repo-checks/src/node/functions/check-encore-service.function.ts`, `packages/developer/cli/src/node/encore/functions/prepare-encore-service.function.ts` — covers: AC-001, P-001 — route: spec-task
- [x] T002 the service's typecheck config in `packages/developer/gen/src/core/constants/typecheck-tsconfig.constant.ts`, `packages/developer/gen/src/core/functions/emit-tool-configs.function.ts`, `packages/developer/gen/src/core/index.ts` and the 14 service goldens — covers: AC-002, P-002 — route: spec-task
- [x] T003 the typecheck run, with a test, in `packages/developer/cli/src/node/functions/resolve-tool.function.ts` — covers: AC-003, P-003 — route: spec-task — deps: T002
- [x] T004 the committed services in `services/example/tsconfig.json`, `services/health/tsconfig.json` — covers: AC-004 — route: spec-task — deps: T001
- [x] T005 ADR 0091 rule 4 and the changeset in `apps/docs/src/docs/adr/0091-generated-encore-app-in-stackra-folder.mdx`, `.changeset/encore-paths-one-target.md` — covers: AC-001 — route: spec-task — deps: T003

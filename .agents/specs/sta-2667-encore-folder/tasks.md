# Tasks: gen writes a service's Encore folder outside the .stackra dot folder

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2667

- [x] T001 the folder constant and helper, every Encore emitter, the app import and the migrations copy, with their tests and the golden files, in `packages/developer/gen/src/core/constants/encore-services-dir.constant.ts`, `packages/developer/gen/src/core/functions/encore-service-folder.function.ts`, `packages/developer/gen/src/core/constants/encore-app-import.constant.ts`, `packages/developer/gen/src/node/functions/generate.function.ts` — covers: AC-001, AC-002, P-001, P-002 — route: spec-task
- [x] T002 `stackra dev` runs encore in the member root, gen's tree names the folder, and runway's deploy tree carries it, in `packages/developer/cli/src/node/functions/resolve-tool.function.ts`, `packages/developer/cli/src/node/create/functions/gen-tree.function.ts`, `packages/developer/runway/src/node/functions/encore-deploy-tree.function.ts` — covers: AC-003, P-003 — route: spec-task — deps: T001
- [x] T003 the ignore rules, the message texts and ADR 0091 in `.gitignore`, `packages/data/database/src/node/functions/database-url.function.ts`, `packages/developer/runway/src/node/functions/secret-sync-plan.function.ts`, `apps/docs/src/docs/adr/0091-generated-encore-app-in-stackra-folder.mdx` — covers: AC-004, P-004 — route: spec-task — deps: T002
- [x] T004 the changeset in `.changeset/gen-encore-folder.md` — covers: AC-001 — route: spec-task — deps: T003

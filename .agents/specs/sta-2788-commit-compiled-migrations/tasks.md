# Tasks: gen: commit the compiled migrations, and the apply path runs exactly the committed SQL

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2788

- [x] T001 commit a service's compiled stream and Encore copy; `--check` fails on drift in `packages/developer/gen/src/node/functions/generate.function.ts`, `packages/developer/gen/src/core/functions/is-committed-migration.function.ts`, `.gitignore` — covers: AC-001, AC-002, P-001 — route: spec-task
- [x] T002 ship the committed SQL to Encore unchanged and refuse drift in `packages/developer/runway/src/node/functions/encore-deploy-tree.function.ts`, `packages/developer/runway/src/node/drivers/encore-cloud-provider.driver.ts` — covers: AC-003, P-003 — route: spec-task
- [x] T003 a package commits its own compiled SQL and a host refuses drift in `packages/developer/gen/src/core/functions/emit-package-migrations.function.ts`, `packages/developer/gen/src/core/functions/migration-step-files.function.ts`, `packages/developer/gen/src/core/functions/emit-migrations.function.ts`, `packages/developer/gen/src/core/constants/package-migrations-dir.constant.ts`, `packages/developer/gen/README.md`, `packages/developer/gen/src/node/functions/compile-migrations.function.ts`, `packages/*/*/src/node/database/compiled-migrations/*.sql` — covers: AC-001, AC-004, P-002 — route: spec-task
- [x] T004 the gate checks and Squawk lints the committed SQL in `.github/workflows/ci.yml`, `.github/workflows/README.md`, `turbo.jsonc` — covers: AC-002, AC-005 — route: spec-task

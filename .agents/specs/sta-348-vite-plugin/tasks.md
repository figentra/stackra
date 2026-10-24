# Tasks: `@stackra/vite-plugin` wave 3

**Input**: `.agents/specs/sta-348-vite-plugin/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-vite-plugin/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/developer/vite-plugin` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US2] `corePlugins`, `generatedModulesPlugin`, `serverOnlyPlugin` in `src/core/functions/` — covers: FR-003, FR-004 — route: package — deps: T002
- [x] T004 [US3] `pagesPlugin`, `manifestsPlugin`, `budgetsPlugin`, `prerenderPlugin` — covers: FR-005 — route: package — deps: T003
- [x] T005 [US1] `renderPlugins`, `pwaPlugin`, `sentryPlugin` — covers: FR-005, FR-006 — route: package — deps: T002
- [x] T006 [US1] `viteConfig`, `stackra`, the `.` stand-in barrel and `ViteConfigOptions` — covers: FR-002, SC-001 — route: package — deps: T004, T005
- [x] T007 [US1, US2, US3] Tests beside every public symbol and plugin (`__tests__/`) — covers: SC-002 — route: tests — deps: T006
- [x] T008 [US1] Changeset `.changeset/vite-plugin-package.md` — covers: SC-001 — route: package — deps: T006
- [ ] T009 [US1] Catalog entries for `vite-plugin-pwa`, `@cloudflare/vite-plugin`, `@react-router/dev`, `@sentry/vite-plugin` (owner) — covers: FR-001 — route: owner
- [ ] T010 [US1, US2, US3] Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-003 — route: tests — deps: T007, T009

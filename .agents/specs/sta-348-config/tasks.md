# Tasks: `@stackra/config` wave 1d

**Input**: `.agents/specs/sta-348-config/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-config/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/foundation/config` — covers: FR-001, FR-007 — route: package — deps: T001
- [x] T003 [US1] `Config` kind base, `ConfigClass`, `ConfigOptions`, `EnvMap`, `configKey` — covers: FR-002, FR-004 — route: package — deps: T002
- [x] T004 [US2] `SecretStore` port, `@Secret`, `ConfigInvalidError`, `buildConfig` and its internal halves — covers: FR-005, FR-006 — route: package — deps: T003
- [x] T005 [US3] `hydrateEnv`, `PublicPart`, `BuildFacts`, `EnvDerivations`, `env` and `EnvValue` — covers: FR-002 — route: package — deps: T004
- [x] T006 [US4] `./react` `useConfig` — covers: FR-003 — route: package — deps: T003
- [x] T007 [US5] `./testing` plugin with `.withConfig` and `.withSecrets` — covers: FR-003 — route: package — deps: T004
- [x] T008 Stand-in barrels for the three entries — covers: FR-001, FR-002 — route: package — deps: T005, T006, T007
- [x] T009 Tests beside every subject and the barrel tests — covers: SC-002, SC-003 — route: tests — deps: T008
- [x] T010 Changeset `.changeset/config-package.md` — covers: SC-001 — route: package — deps: T008
- [ ] T011 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T009

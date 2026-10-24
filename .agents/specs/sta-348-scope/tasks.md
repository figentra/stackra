# Tasks: `@stackra/scope` wave 5

**Input**: `.agents/specs/sta-348-scope/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-scope/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/security/scope` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `ScopeConfig` in `packages/security/scope/src/config/scope.config.ts`, with `ScopeOptions`, `ScopeConfig$` and the level catalogues in `packages/security/scope/assets/lang/` — covers: FR-002, P-002, FR-008, P-008 — route: package — deps: T002
- [x] T004 [US2] `ScopeTree`, `ScopeResolver`, `GrantedScopes` and their types in `packages/security/scope/src/contracts/` — covers: FR-003, P-003 — route: package — deps: T002
- [x] T005 [US2] The resolver steps and `ChainScopeResolverDriver` in `packages/security/scope/src/core/drivers/`, with `ScopeUnresolvedError` and the path functions — covers: FR-004, P-004 — route: package — deps: T003, T004
- [x] T006 [US3] `ScopeNode`, `ScopeNodeService`, `PostgresScopeTreeDriver` and the migration in `packages/security/scope/src/node/`, with `MemoryScopeTreeDriver` — covers: FR-005, P-005 — route: package — deps: T005
- [x] T007 [US3] `ScopeDepthEntitlement` in `packages/security/scope/src/node/access/scope-depth.entitlement.ts` — covers: FR-006, P-006 — route: package — deps: T006
- [x] T008 [US4] `ActiveScopeService` in `packages/security/scope/src/core/services/active-scope.service.ts` and `useScope` in `packages/security/scope/src/react/scope/use-scope.ts` — covers: FR-007, P-007 — route: package — deps: T004
- [x] T009 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T008
- [x] T010 [US1] Changeset `.changeset/scope-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T009
- [ ] T011 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T010

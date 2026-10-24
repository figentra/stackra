# Tasks: `@stackra/tenancy` wave 5

**Input**: `.agents/specs/sta-348-tenancy/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-tenancy/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/security/tenancy` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `BelongsToTenantMacro` with its `Blueprint` augmentation in `packages/security/tenancy/src/node/database/macros/` and `src/node/types/` — covers: FR-002, P-002 — route: package — deps: T002
- [x] T004 [US1] `TenantIsolationService` in `packages/security/tenancy/src/node/services/tenant-isolation.service.ts` and `BelongsToTenant` in `src/node/traits/belongs-to-tenant.trait.ts`, with the internal setting and tenant storage — covers: FR-003, P-003, FR-004, P-004 — route: package — deps: T003
- [x] T005 [US2] `TenancyScopes`, `TENANT_SCOPE_LEVEL`, `TENANT_SCOPE_ALIAS` and the catalogues in `packages/security/tenancy/src/core/` and `assets/lang/` — covers: FR-005, P-005 — route: package — deps: T002
- [x] T006 [US3] `TenantScopeResolverDriver` and `isTenantId` in `packages/security/tenancy/src/core/` — covers: FR-006, P-006 — route: package — deps: T005
- [x] T007 [US4] `TenantSwitcher`, `TenantMembership` and the refusals in `packages/security/tenancy/src/core/`, and `useTenant` and `useTenantSwitcher` in `src/react/tenant/` — covers: FR-007, P-007, FR-008, P-008 — route: package — deps: T005
- [x] T008 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T007
- [x] T009 [US1] Changeset `.changeset/tenancy-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package; the scratch typecheck passes — covers: SC-001, SC-003 — route: package — deps: T008
- [ ] T010 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T009

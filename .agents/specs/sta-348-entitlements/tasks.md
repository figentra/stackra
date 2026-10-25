# Tasks: `@stackra/entitlements` wave 4

**Input**: `.agents/specs/sta-348-entitlements/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-entitlements/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/security/entitlements` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `Entitlement` in `packages/security/entitlements/src/core/bases/entitlement.base.ts`, with `EntitlementKind`, `EntitlementOptions` and `EntitlementClass` — covers: FR-003, P-003 — route: package — deps: T002
- [x] T004 [US2] `EntitlementSource` and `EntitlementUsage` in `packages/security/entitlements/src/core/ports/`, with `EntitlementGrant` — covers: FR-004, P-004 — route: package — deps: T003
- [x] T005 [US2] `LimitReachedError` in `packages/security/entitlements/src/core/errors/limit-reached.error.ts` — covers: FR-006, P-006 — route: package — deps: T002
- [x] T006 [US4] `registerEntitlements`, `entitlementKey` and the internal registry in `packages/security/entitlements/src/core/functions/` and `packages/security/entitlements/src/core/constants/`, with `EntitlementRegistration` — covers: FR-007, P-007 — route: package — deps: T003
- [x] T007 [US2] `PlanEntitlementCheckDriver` in `packages/security/entitlements/src/core/drivers/plan-entitlement-check.driver.ts` — covers: FR-005, P-005 — route: package — deps: T004, T005, T006
- [x] T008 [US3] `fakeEntitlements` in `packages/security/entitlements/src/testing/functions/fake-entitlements.function.ts` — covers: FR-008, P-008 — route: package — deps: T004
- [x] T009 [US1] Stand-in barrels `packages/security/entitlements/src/core/index.ts` and `packages/security/entitlements/src/testing/index.ts` and their export-list tests — covers: FR-002, P-002 — route: package — deps: T007, T008
- [x] T010 [US1] Tests for every public symbol in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T009
- [x] T011 [US1] Changeset `.changeset/entitlements-package.md`; `oxfmt` and `oxlint` clean; typecheck passes — covers: SC-001, SC-003 — route: package — deps: T010
- [ ] T012 [US1] Run the package's tests and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T010
- [x] T013 [US2] R5 reconciliation: `PlanEntitlementCheckDriver` asks the grant and the count in the id of the call's `scope` (platform-wide without one) instead of the descriptor's tenant id; the ports' shortcut notes, README, AGENTS and changeset say so — covers: FR-005, P-005 — route: package — deps: T011

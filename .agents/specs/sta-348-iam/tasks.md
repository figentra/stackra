# Tasks: `@stackra/iam` wave 6

**Input**: `.agents/specs/sta-348-iam/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-iam/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/security/iam` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `Permissions`, `Policy`, `Role` and `Permission` in `packages/security/iam/src/core/{bases,values}/`, with `PolicyOptions` and `RoleOptions` — covers: FR-003, P-003 — route: package — deps: T002
- [x] T004 [US2] `PolicySource`, the snapshot types and `Capability` in `packages/security/iam/src/contracts/` — covers: FR-004, P-004 — route: package — deps: T002
- [x] T005 [US2] `registerPermissions`, `registerRoles`, `registerPolicies`, `connectPolicies`, `permissionKey` and the internal registries in `packages/security/iam/src/core/{functions,constants}/` — covers: FR-007, P-007 — route: package — deps: T003
- [x] T006 [US2] `PolicyDecisionPointService` in `packages/security/iam/src/core/services/policy-decision-point.service.ts`, with `Decision`, `Risk`, `SystemRole`, `AccessReason` — covers: FR-004, FR-005, P-004, P-005 — route: package — deps: T004, T005
- [x] T007 [US2] `IamAccessControlDriver`, `IamGrantedScopesDriver` and `MemoryPolicySourceDriver` in `packages/security/iam/src/core/drivers/` — covers: FR-006, P-006 — route: package — deps: T006
- [x] T008 [US3] `PermissionSnapshotService` and `usePermission` in `packages/security/iam/src/core/services/` and `packages/security/iam/src/react/permission/` — covers: FR-008, P-008 — route: package — deps: T005
- [x] T009 [US4] `actors` and `IAM_TESTING_PLUGIN` in `packages/security/iam/src/testing/constants/` — covers: FR-008, P-008 — route: package — deps: T007
- [x] T010 [US1] Stand-in barrels for `.`, `./contracts`, `./react` and `./testing` and their export-list tests — covers: FR-002, P-002 — route: package — deps: T009
- [x] T011 [US2] `risk` typed as `Risk` in `packages/application/clients/src/core/types/` and `packages/application/clients/src/react/intent-router/` — covers: FR-009, P-009 — route: package — deps: T006
- [x] T012 [US1] Tests for every public symbol in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T010
- [x] T013 [US1] Changeset `.changeset/iam-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T012
- [ ] T014 [US1] Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T012

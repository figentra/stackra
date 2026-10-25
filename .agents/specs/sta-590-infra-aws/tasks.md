# Tasks: `@stackra/infra-aws`

**Input**: `.agents/specs/sta-590-infra-aws/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-590-infra-aws/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/infrastructure/infra-aws` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1, US2] Runway schema, `awsBaselineConfig`, `awsAccounts` and their types in `packages/infrastructure/infra-aws/src/core/` — covers: FR-002 — route: infra — deps: T002
- [x] T004 [US1] `resolveRef`, `policyOf`, `roleName`, `backupTargets`, `dataKey`, `privateBucket` in `packages/infrastructure/infra-aws/src/node/functions/` — covers: FR-003, FR-011 — route: infra — deps: T003
- [x] T005 [US1] `filesBucket` and `databaseBackups` in `packages/infrastructure/infra-aws/src/node/functions/` — covers: FR-004, FR-005 — route: infra — deps: T004
- [x] T006 [US1] `ciAccess`, `encoreAccess` and `costControls` in `packages/infrastructure/infra-aws/src/node/functions/` — covers: FR-006, FR-007, FR-008 — route: infra — deps: T004
- [x] T007 [US1] `awsBaseline` in `packages/infrastructure/infra-aws/src/node/functions/aws-baseline.function.ts` — covers: FR-003 — route: infra — deps: T005, T006
- [x] T008 [US2] `stateBackend` and `backupAccount` in `packages/infrastructure/infra-aws/src/node/functions/` — covers: FR-009, FR-010 — route: infra — deps: T004
- [x] T009 [US1, US2] `mockPulumi` and `outputOf` in `packages/infrastructure/infra-aws/src/testing/` — covers: FR-011 — route: tests — deps: T002
- [x] T010 [US1, US2] Tests beside every public symbol (`packages/infrastructure/infra-aws/src/**/__tests__/`) — covers: SC-001 — route: tests — deps: T007, T008, T009
- [x] T011 [US1] Changeset `.changeset/infra-aws-package.md` — covers: FR-001 — route: package — deps: T007
- [ ] T012 [US1, US2] Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T010

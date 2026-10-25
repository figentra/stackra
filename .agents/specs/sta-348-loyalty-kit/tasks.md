# Tasks: `@stackra/loyalty-kit` wave 6

**Input**: `.agents/specs/sta-348-loyalty-kit/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-loyalty-kit/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG, lang files) in `packages/commerce/loyalty-kit` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US2] Ports, enums and types in `packages/commerce/loyalty-kit/src/contracts/` — covers: FR-002, P-002 — route: package — deps: T002
- [x] T004 [US2] `LoyaltyKitConfig` with its shape and shipped schema, `LoyaltyService`, the memory driver, the refusals, the views, constants and functions in `src/config/` and `src/core/` — covers: FR-003, P-003, FR-004, P-004 — route: package — deps: T003
- [x] T005 [US3] Models, migrations, the Postgres driver on `Journal<LedgerEntry>` with the floor fix in `src/node/` — covers: FR-004, P-004, FR-007, P-007 — route: package — deps: T004
- [x] T006 [US1] The module, settings, actions, queries, schemas, events, extension point, extension, listener and services in `src/node/` — covers: FR-005, P-005, FR-006, P-006 — route: package — deps: T005
- [x] T007 [US4] Web and native renderers in `src/react/` and `src/native/` — covers: FR-008, P-008 — route: package — deps: T004
- [x] T008 [US5] The fake, fixture and matcher in `src/testing/`, the factories and the demo seeder in `src/node/database/` — covers: FR-009, P-009 — route: package — deps: T005
- [x] T009 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T008
- [x] T010 [US1] Changeset `.changeset/loyalty-kit-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T009
- [x] T012 [US7] Reconciliation R2, iam: `LoyaltyAccountPermissions` and `LoyaltyAccountPolicy` in `src/node/access/`, the `permission:` option on the five existing actions and queries, with tests — covers: FR-010, P-010 — route: package — deps: T010
- [x] T013 [US6] Reconciliation R2, workflow: `RedeemPointsWorkflow` and `RedemptionConfirmed` in `src/node/workflows/`, `RedeemPointsAction`, `ConfirmRedemptionAction`, `RedeemPointsOutput`, `ConfirmRedemptionInput`, `ConfirmRedemptionOutput`, `QuotedRedemption`, `REVERT_REFERENCE_PREFIX`, with tests (the timeout test follows the engine: the call answers when the run parks) — covers: FR-011, P-011 — route: package — deps: T012
- [x] T014 [US7] Reconciliation R2, panel: `LoyaltyAccountResource`, `LoyaltyOverviewDocument`, `PointsBalanceWidget`, `PointsIssuedWidget` in `src/node/resources/loyalty-account/` with the icon, slot and key stand-ins, with tests; barrels, README, AGENTS and changeset updated; the expire job's `perTenant` renamed `perScope` after R1 — covers: FR-012, P-012, SC-001 — route: package — deps: T013
- [ ] T011 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install, with the Postgres integration tests — covers: SC-002, SC-003 — route: tests — deps: T014

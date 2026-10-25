# Tasks: `@stackra/outbox` wave 6

**Input**: `.agents/specs/sta-348-outbox/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-outbox/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/runtime/outbox` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] The ports, stored types and enums in `packages/runtime/outbox/src/contracts/` — covers: FR-005, P-005 — route: package — deps: T002
- [x] T004 [US1] `OutboxConfig` in `packages/runtime/outbox/src/config/outbox.config.ts`, with `OutboxOptions`, `OutboxConfig$` and the driver names — covers: FR-007, P-007 — route: package — deps: T002
- [x] T005 [US1] `eventName`, `registerEventNames`, `eventMessage`, `mintEventId`, the memory drivers, `OutboxEventOutboxDriver` and `UnknownEventError` in `packages/runtime/outbox/src/core/` — covers: FR-005, P-005, FR-006, P-006 — route: package — deps: T003
- [x] T006 [US1] `OutboxWriterService` and `insertMessages` in `packages/runtime/outbox/src/node/` — covers: FR-002, P-002, FR-008, P-008 — route: package — deps: T005
- [x] T007 [US1] `OutboxRelayService` in `packages/runtime/outbox/src/node/services/` — covers: FR-003, P-003 — route: package — deps: T005
- [x] T008 [US2] `InboxService` and `InboxEventPublisherDriver` — covers: FR-004, P-004 — route: package — deps: T005
- [x] T009 [US3] `PostgresOutboxDriver`, `PostgresInboxDriver`, `CreateMessagesMigration` and `CreateInboxMigration` — covers: FR-005, P-005 — route: package — deps: T003
- [x] T010 [US4] `registerChangeConsumers` and the change path of the writer and the relay — covers: FR-002, P-002, FR-003, P-003 — route: package — deps: T006, T007
- [x] T011 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T010
- [x] T012 [US1] Changeset `.changeset/outbox-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T011
- [ ] T013 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T012

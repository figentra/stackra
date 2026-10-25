# Tasks: runtime package extensions (STA-348 ext-runtime)

**Input**: `.agents/specs/sta-348-ext-runtime/`

- [x] T001 Spec, plan and tasks — covers: SC-001 — route: spec-draft
- [x] T002 [US1] actions: approval stage, effect tags, structural guard, meters, audit driver, cap amount field — covers: FR-001, FR-003, FR-004 — route: package
- [x] T003 [US2] actions: `StoresConfig` and the Valkey idempotency and rate-limit stores — covers: FR-001, FR-002 — route: package
- [x] T004 [US2] locking: `ValkeyLockDriver` and its config fields — covers: FR-002, FR-004 — route: package
- [x] T005 [US3] queue: `BrokerPublisher`, `BrokerConfig` and the memory, topic and Valkey drivers — covers: FR-001, FR-002 — route: package
- [x] T006 [US3] outbox: broker `EventPublisher` and the Postgres offline-queue stores with migration 0003 — covers: FR-001 — route: package
- [x] T007 [US3] scheduler: `encoreCronJobs`, `fire`, `tick({ crons })` — covers: FR-001, FR-004 — route: package
- [x] T008 [US4] realtime: fan-out port and drivers, relay, rooms with caps — covers: FR-001, FR-002, FR-004 — route: package
- [x] T009 [US4] collaboration: `RoomTokens`, realtime drivers, Postgres snapshot store — covers: FR-001 — route: package
- [x] T010 query: `OfflineCap` from actions — covers: FR-004 — route: package
- [x] T011 [US5] config: Infisical and AWS Secrets Manager secret stores — covers: FR-002 — route: package
- [x] T012 [US5] errors, logger, contracts: Sentry, OTLP, `Tracer`, AES-GCM cipher, memory keys, `LiveReadOnlyError` — covers: FR-001, FR-002 — route: package
- [x] T013 Tests beside every new subject, barrel lists, README, AGENTS and one changeset per package — covers: SC-001, SC-002 — route: tests
- [ ] T014 Add `@aws-sdk/client-secrets-manager` to a catalog, `pnpm install`, then run the tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests

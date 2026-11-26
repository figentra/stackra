---
description: "Tasks for STA-2841: the fault-injection tier for the queue, the outbox and payments"
---

# Tasks: the fault-injection tier for the queue, the outbox and payments

**Input**: Design documents from `.agents/specs/sta-2841-fault-injection-tier/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The kit

**Goal**: `@stackra/testing` can fail a provider, a store or a Postgres write.

- [x] T001 Test first: before and after faults, call numbers, own errors, heal, recording, prototype, refused rules in `packages/developer/testing/src/core/functions/__tests__/inject-faults.function.test.ts` and `packages/developer/testing/src/core/errors/__tests__/injected-fault.error.test.ts` — covers: FR-001, P-001, EC-03, EC-04, AC-005 — route: tests
- [x] T002 Add `injectFaults`, `InjectedFaultError` and the fault types in `packages/developer/testing/src/core/functions/inject-faults.function.ts` and export them from `packages/developer/testing/src/core/index.ts` — covers: FR-001, P-001, EC-03, EC-04, AC-005 — route: package — deps: T001
- [x] T003 Test first, then add `postgresFault` and its types in `packages/developer/testing/src/core/functions/postgres-fault.function.ts` — covers: FR-002, P-002, EC-02, AC-005 — route: package — deps: T002

## Phase 2: User Story 1 - A store failure never compensates work that succeeded (Priority: P1)

**Goal**: the worker records outcomes outside the attempt.

**Independent Test**: the memory store with `remove` faulted; Postgres with the delete faulted.

- [x] T004 [US1] Test first: the queue fault suite in `packages/runtime/queue/src/node/services/__tests__/queue-worker.service.fault.test.ts` — covers: FR-003, FR-004, P-003, P-004, EC-05, AC-001, AC-002 — route: tests — deps: T003
- [x] T005 [US1] Record the release and the remove after the attempt's `try` in `packages/runtime/queue/src/node/services/queue-worker.service.ts` — covers: FR-003, P-003, AC-001 — route: package — deps: T004
- [x] T006 [US1] The Postgres suite in `packages/runtime/queue/src/node/services/__tests__/queue-worker.service.fault.int.test.ts` — covers: FR-003, FR-004, EC-01, AC-001 — route: tests — deps: T005

## Phase 3: User Story 2 - Faults lose nothing and do nothing twice (Priority: P1)

- [x] T007 [US2] The outbox suites in `packages/runtime/outbox/src/node/services/__tests__/outbox-relay.service.fault.test.ts` and `outbox-relay.service.fault.int.test.ts` — covers: FR-005, P-004, EC-01, AC-003 — route: tests — deps: T003
- [x] T008 [US2] The payments suites in `packages/commerce/payments/src/core/services/__tests__/payment.service.fault.test.ts` and `packages/commerce/payments/src/node/drivers/__tests__/postgres-payment-records.driver.fault.int.test.ts` — covers: FR-006, P-004, EC-01, AC-004 — route: tests — deps: T003

## Phase 4: Polish

- [x] T009 Document the kit, the suites and the worker rule in `packages/developer/testing/README.md`, the four `AGENTS.md` files, `apps/docs/src/docs/standards/testing-by-kind.mdx` and `.changeset/fault-injection-tier.md` — covers: SC-001, SC-002, SC-003, AC-001, AC-005 — route: steward-docs — deps: T008
- [ ] T010 Run the four packages' tests, typecheck, oxlint and oxfmt, then `pnpm verify` — covers: SC-001, SC-002, SC-003, SC-004, AC-001, AC-002, AC-003, AC-004, AC-005 — route: verify-fix — deps: T009

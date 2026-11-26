---
description: "Tasks for STA-2050: a service runway sizes the Encore subscriptions its jobs ride"
---

# Tasks: a service runway sizes the Encore subscriptions its jobs ride

**Input**: Design documents from `.agents/specs/sta-2050-runway-queue-settings/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Discovery

**Goal**: a service's IR carries its runway queue settings.

- [x] T001 Test first: the reader keeps well-formed settings per environment and `discoverMember` puts them on the IR in `packages/developer/gen/src/node/functions/__tests__/read-runway-queues.function.test.ts` — covers: FR-001, P-002, EC-03, EC-04, EC-05, AC-004 — route: tests
- [x] T002 Add `QueueSettings`, `MemberIR.queueSettings` and `readRunwayQueues`, and call it from discovery in `packages/developer/gen/src/core/types/queue-settings.type.ts`, `packages/developer/gen/src/core/types/member-ir.type.ts`, `packages/developer/gen/src/node/functions/read-runway-queues.function.ts` and `packages/developer/gen/src/node/functions/discover-member.function.ts`; export the type from `packages/developer/gen/src/core/index.ts` — covers: FR-001, FR-005, P-002, P-004, AC-004 — route: package — deps: T001

## Phase 2: User Story 1 - A long job is not handed to a second worker (Priority: P1)

**Goal**: each job queue subscription takes the runway's largest visibility timeout.

**Independent Test**: emit the billing fixture's queues file with settings; parse it with Encore.

- [x] T003 [US1] Test first: the largest timeout, the one-second floor and no setting in `packages/developer/gen/src/core/functions/__tests__/queue-ack-deadline.function.test.ts` and the subscription line in `packages/developer/gen/src/core/functions/__tests__/emit-encore-queues.function.test.ts` — covers: FR-002, FR-003, P-001, EC-01, EC-02, AC-001, AC-002 — route: tests — deps: T002
- [x] T004 [US1] Add `queueAckDeadline` in `packages/developer/gen/src/core/functions/queue-ack-deadline.function.ts` and write `ackDeadline` in `packages/developer/gen/src/core/functions/emit-encore-queues.function.ts` — covers: FR-002, FR-003, P-001, AC-001, AC-002 — route: package — deps: T003

## Phase 3: User Story 2 - A setting Encore cannot honour is reported (Priority: P2)

- [x] T005 [US2] Test first: one warning per environment for `dlq: false` on a job queue, quiet otherwise, in `packages/developer/gen/src/core/functions/__tests__/check-queue-settings.function.test.ts` — covers: FR-004, P-003, AC-003 — route: tests — deps: T002
- [x] T006 [US2] Add `checkQueueSettings` in `packages/developer/gen/src/core/functions/check-queue-settings.function.ts` and return its warnings from the full run in `packages/developer/gen/src/node/functions/generate.function.ts` — covers: FR-004, P-003, AC-003 — route: package — deps: T005

## Phase 4: Polish

- [x] T007 Document the deadline, the clamping note and the warning in `packages/developer/gen/README.md`, `packages/developer/gen/AGENTS.md`, `packages/developer/runway/src/core/constants/service-environment-schema.constant.ts` and `.changeset/sta-2050-queue-subscription-settings.md` — covers: SC-001, AC-001, AC-003 — route: steward-docs — deps: T004, T006
- [x] T008 Prove Encore parses the generated subscription with the runway deadline (`encore debug meta` inside the stackra-demo container) — covers: SC-002, AC-001 — route: verify-fix — deps: T004
- [ ] T009 Run the `@stackra/gen` and `@stackra/runway` tests, typecheck, oxlint and oxfmt, then `pnpm verify`, in `packages/developer/gen/package.json` — covers: SC-001, SC-003, AC-001, AC-002, AC-003, AC-004 — route: verify-fix — deps: T007

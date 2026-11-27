# Feature Specification: the fault-injection tier for the queue, the outbox and payments

**Feature Branch**: `figentra/sta-2841-fault-injection-tier`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2841

**Linear project**: Runway CI/CD

**Clarifications status**: complete

**Analyze**: —

**Input**: ADR 0182 decision 4 lists fault injection among the testing policies, and decisions 1 and 3 place tests in
the unit tier and on a real Postgres in the integration tier. No test injected a provider or database fault into an
at-least-once path: the queue worker, the outbox relay and the payment engine were tested only on the happy path and
on clean refusals. The readiness audit of 26 Nov split this out of STA-229 as STA-2841.

### Sources

- `apps/docs/src/docs/adr/0182-testing-strategy-v2-tiers-coverage-infrastructure-and-policies.mdx` (decisions 1, 3, 4)
- `packages/runtime/queue/src/node/services/queue-worker.service.ts` (`run`, `failed`: before this change a store
  error while removing a finished job was caught as the job's own failure)
- `packages/runtime/outbox/src/node/services/outbox-relay.service.ts`, `inbox.service.ts`
- `packages/commerce/payments/src/core/services/payment.service.ts` (`guard`, `onToken`, `refund`, `reconcile`)
- `packages/developer/testing` (the generic kit, ADR 0269 decision 2)
- FR-001 to FR-006: the PR's diff against `main` and its tests
- FR-007: the CTO's review of the PR (2026-11-27): the relay recorded a failed delete as a failed delivery, the same
  bug the queue fix removes (`deliver` in `outbox-relay.service.ts`)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: `apps/docs` (`standards/testing-by-kind.mdx`)
- **Services touched**: none
- **Packages touched**: packages/developer/testing (new exports), packages/runtime/queue (worker fix and tests),
  packages/runtime/outbox (relay fix, tests and AGENTS.md), packages/commerce/payments (tests and AGENTS.md)
- **Public contract change**: additive. `@stackra/testing` `.` exports `injectFaults`, `postgresFault`,
  `InjectedFaultError` and the types `FaultRule`, `FaultCall`, `FaultTiming`, `FaultInjection`, `PostgresFault`,
  `PostgresFaultOptions`, `PostgresWrite`. `@stackra/queue`: no signature changes; `QueueWorkerService.drain` and
  `process` now throw a store's error raised while recording a finished or throttled attempt, as their docs already
  said, instead of counting it as the job's failure.
- **Cross-service events**: none
- **Tenancy and data**: none. The tests run as the NOBYPASSRLS service role in the owner's isolation; the database
  faults are installed by the test superuser and removed after each test.
- **Security and privacy**: `postgresFault` checks every identifier as snake_case and the SQLSTATE as five characters, so
  no test value reaches its SQL unquoted; it is test support and never runs in production.
- **Secrets**: none
- **ADR needed**: no (implements ADR 0182 decision 4 inside the tiers of decisions 1 and 3)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/testing/README.md`, `packages/developer/testing/AGENTS.md`,
  `packages/runtime/queue/AGENTS.md`, `packages/runtime/outbox/AGENTS.md`, `packages/commerce/payments/AGENTS.md`,
  `apps/docs/src/docs/standards/testing-by-kind.mdx`, `.changeset/fault-injection-tier.md`
- **Lane**: full (new public test exports and a behaviour fix in the queue worker)
- **Change risk**: R1 (the worker fix changes only the path where the store fails after a finished attempt)

## Glossary _(full lane)_

- **At-least-once path**: work that is retried until its outcome is recorded: a queue job, an outbox message, a
  provider payment call.
- **Fault before**: the call fails before the target acts (the request never arrived).
- **Fault after**: the target acts and the answer is lost (a commit or provider call succeeded, the reply did not
  come back).
- **Recording an outcome**: the store write after an attempt: remove, retry, release, dead letter.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A store failure never compensates work that succeeded (Priority: P1)

A job sends a message on its last attempt. The send succeeds, then the database fails as the worker deletes the job.
The message must not be marked failed by `onDeadLetter`, and the job must not be dead-lettered; it runs again once its
lease lapses and replays its result under the same Idempotency-Key.

**Independent Test**: the memory store wrapped by `injectFaults` failing `remove`; a Postgres trigger failing the delete.

**Acceptance Scenarios**:

1. **Given** a job with no retries left whose `remove` fails, **When** the worker drains, **Then** the drain rejects
   with the store's error, no `retry` or `deadLetter` is written, and `onDeadLetter` is not called.
2. **Given** that job after its lease lapses, **When** the worker drains, **Then** it is done with the first attempt's
   output, the provider acted once and the job is gone.

### User Story 2 - Faults lose nothing and do nothing twice (Priority: P1)

A maintainer changing the queue, the outbox or payments runs the fault suites and sees that a provider or store failure
at any step loses no work and repeats no effect.

**Acceptance Scenarios**:

1. **Given** a provider failing before acting, **When** the job or message is retried, **Then** it is delivered once.
2. **Given** a provider acting and losing its answer, **When** the job is retried, **Then** it calls the provider under
   the same Idempotency-Key; an outbox message is published again under the same id and the inbox runs the listener
   once; a payment becomes `unknown` and only `reconcile` moves it.
3. **Given** a store failing to claim, reserve or record a retry, **When** the next drain or tick runs, **Then** the
   work is delivered once and nothing is dead-lettered.
4. **Given** the payment records failing after the provider charged, **When** the charge is retried, **Then** the
   provider is reached under the same merchant reference and holds one payment.

### Edge Cases

- **EC-01**: A fault inside one database transaction rolls back every write before it (the lease, a pending payment
  record); the int tests assert the rolled-back state.
- **EC-02**: `postgresFault`'s counter is a sequence, so a failed write still counts after a rollback.
- **EC-03**: A rule naming a method the target lacks, or a call number below 1, throws when the faults are injected.
- **EC-04**: The wrapped target's own internal calls are neither recorded nor faulted.
- **EC-05**: A store that removes a job and loses the answer leaves nothing to run again; the drain still fails.
- **EC-06**: A store that deletes a delivered outbox message and loses the answer leaves nothing to deliver again; the
  tick still fails and the rest of its batch is delivered on the next one.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE `@stackra/testing` `.` entry SHALL export `injectFaults(target, rules)`, which returns the wrapped
  target, every call it received and `heal()`, and fails each matching call `before` the target acts or `after` it with
  the rule's error or an `InjectedFaultError`.
- **FR-002**: THE `@stackra/testing` `.` entry SHALL export `postgresFault(options)`, which builds the install and remove
  SQL of a row trigger failing the chosen writes of one table after `skip` writes for `times` writes with a SQLSTATE,
  refusing an identifier that is not snake_case and a SQLSTATE that is not five characters.
- **FR-003**: WHEN the store fails to record a finished or throttled attempt THE `QueueWorkerService` SHALL fail the drain
  or delivery with that error and SHALL NOT retry, dead-letter, drop or compensate the job.
- **FR-004**: THE queue SHALL ship `.fault.test.ts` and `.fault.int.test.ts` suites proving FR-003 and that provider and
  store faults on reserve, attempt and retry lose no job and repeat no effect.
- **FR-005**: THE outbox SHALL ship `.fault.test.ts` and `.fault.int.test.ts` suites proving that transport and store
  faults on publish, claim, delete and retry lose no message, dead-letter none, and run a listener once.
- **FR-006**: THE payments package SHALL ship `.fault.test.ts` and `.fault.int.test.ts` suites proving that provider and
  record faults on charge, refund and reconcile never charge or refund twice and leave a payment blocked until
  `reconcile` records it.
- **FR-007**: WHEN the store fails to delete a delivered outbox message THE `OutboxRelayService` SHALL fail the tick
  with that error and SHALL NOT count an attempt, retry or dead-letter the message; a failed cross-app fan-out SHALL
  still count as a failed delivery.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a finished job's remove fails THE worker SHALL reject the drain and write no retry or dead letter,
  and the job SHALL replay its result after its lease lapses.
- **AC-002**: WHEN a provider acts and loses its answer THE worker SHALL call it again under the same Idempotency-Key.
- **AC-003**: WHEN the outbox store fails to delete a published message THE relay SHALL fail the tick, count no
  attempt, publish it again under the same id on a later tick, and the inbox SHALL run the listener once; however often
  the delete fails, the message SHALL never be dead-lettered.
- **AC-004**: WHEN the payment records fail after the provider charged THE retry SHALL reach the provider under the same
  reference and the provider SHALL hold one payment.
- **AC-005**: THE `injectFaults` and `postgresFault` helpers SHALL behave as FR-001 and FR-002 say.

## Success Criteria _(mandatory)_

- **SC-001**: `queue-worker.service.fault.test.ts` and `queue-worker.service.fault.int.test.ts` prove AC-001 and
  AC-002, and fail when the worker fix is reverted — verified by: unit, int
- **SC-002**: the outbox and payments fault suites prove AC-003 and AC-004 on memory stores and on Postgres — verified
  by: unit, int
- **SC-003**: `inject-faults.function.test.ts`, `postgres-fault.function.test.ts`, `injected-fault.error.test.ts` and
  `index.test.ts` prove AC-005 — verified by: unit
- **SC-004**: the four packages' tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- Additive exports in `@stackra/testing`; no consumer changes.
- `@stackra/queue`: a deployment whose store fails while recording a finished job now sees the drain fail (logged by
  `work` as `queue.worker_failed`) and the job run again after its lease, instead of a dead letter and an
  `onDeadLetter` call. An action that needs exactly-once effects keeps using its Idempotency-Key.

## Risks

- **R-1**: A job whose result is not replayable (no `IdempotencyStore` bound) runs its handler again after a store
  failure; at-least-once already allowed that, and the queue's docs say every job is idempotent.
- **R-2**: Resolved here (FR-007): the relay no longer counts a delivery whose delete failed as a failed attempt, so
  a delivered message is never dead-lettered for it. What remains is at-least-once itself: after a failed delete an
  event is published again (the inbox deduplicates it by id) and a row change message runs its change consumers again,
  which the outbox already requires to be idempotent; how to hold consumers to that is STA-2915.
- **R-3**: A token charge whose record could not be saved outside a transaction stays `pending` until `reconcile`; a
  retried charge returns it unchanged. The payment engine's recording is not changed here; the follow-up is STA-2916.

## Out of scope

- A `test:fault` turbo task (the suites run in `test` and `test:int`).
- Changing the payment engine's recording behaviour (R-3).
- Latency faults; timeouts are covered by the existing worker timeout test.

## Assumptions

- A provider honours the merchant reference or the Idempotency-Key it is given as an idempotency key.
- The testbed's Postgres (`TESTBED_POSTGRES_HOST`) and Docker (`usePostgres`) are available where `test:int` runs.

## Open questions

None.

## Amendments

- 2026-11-27 · CTO review fixes (Claude, STA-2841 session): FR-005 and R-2 contradicted each other (the suites claimed
  no dead letter while the relay still dead-lettered a delivered message whose delete kept failing). The relay now
  records a delivery the way the queue worker records an attempt: a failed delete fails the tick and counts no attempt
  (FR-007, EC-06, AC-003 changed, R-2 resolved, T011); the unit test that pinned `attempts: 1` is replaced. What
  remains of R-2 is filed as STA-2915 and R-3 as STA-2916. The queue AGENTS.md bullet the first pass split is joined again.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2841 session) · created from the PR diff
- 2026-11-26 · Draft → Clarified · Claude (STA-2841 session) · clarifications complete
- 2026-11-26 · Clarified → Planned · Claude (STA-2841 session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-2841 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-2841 session) · T001 to T009 committed on the branch
- 2026-11-27 · Implementing (amended) · Claude (STA-2841 session) · CTO review fixes: FR-007, EC-06, AC-003, R-2, T011

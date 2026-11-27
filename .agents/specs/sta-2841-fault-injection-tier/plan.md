# Implementation Plan: the fault-injection tier for the queue, the outbox and payments

**Spec**: `.agents/specs/sta-2841-fault-injection-tier/spec.md` · **Linear**: STA-2841 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2841-fault-injection-tier/spec.md`

## Summary

`@stackra/testing` gains a generic fault kit: `injectFaults` (a `Proxy` that fails chosen calls of any object before or
after the real call, recording every call) and `postgresFault` (the SQL of a counting row trigger). The queue, the
outbox and payments each gain a `.fault.test.ts` suite on memory stores and a `.fault.int.test.ts` suite on Postgres.
The queue suite found a bug: a store error while removing a finished job was caught as the job's failure, so the job
was retried or dead-lettered and `onDeadLetter` compensated work that had succeeded. The worker now records the
outcome outside the attempt's `try`.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/testing`, `packages/runtime/queue`, `packages/runtime/outbox`,
  `packages/commerce/payments`
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); `.int` files on the testbed Postgres (`ownerPostgres`) or
  Testcontainers (`usePostgres`)
- **Storage**: test databases only
- **Runtime target**: node (tests); the kit is isomorphic

## Constitution Check

| Law                                   | Result | Note                                                                        |
| ------------------------------------- | ------ | --------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the kit imports only its own files; packages use it as a dev dependency     |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                                  |
| Security                              | PASS   | `postgresFault` validates every identifier and the SQLSTATE                 |
| HTTP and events                       | N/A    | no route or event changes                                                   |
| Tenancy                               | PASS   | the int suites run as the NOBYPASSRLS service role in the owner's isolation |
| Delegation                            | PASS   | one session, one branch                                                     |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                      |
| Test placement (ADR 0022)             | PASS   | every test sits in `__tests__/` beside its subject                          |
| Versions and catalogs                 | PASS   | no dependency added                                                         |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                           |
| Licence tier (ADR 0077)               | PASS   | free                                                                        |
| Docs and ADRs                         | PASS   | READMEs, AGENTS.md files, the testing standard and a changeset              |

## Deploy modes

| Mode       | Behaviour                                                                      |
| ---------- | ------------------------------------------------------------------------------ |
| SaaS       | the worker fails the drain on a store error while recording, and retries later |
| On-prem    | same                                                                           |
| Air-gapped | same                                                                           |

## Correctness properties

- **P-001**: for every rule set and call sequence, `injectFaults` fails exactly the calls whose number a matching rule names, and records every outside call in order — Validates: FR-001
- **P-002**: for every `skip` ≥ 0 and `times` ≥ 1, the trigger fails row writes `skip + 1` to `skip + times` and passes every other — Validates: FR-002
- **P-003**: for every job, a store error while recording a finished attempt leaves no retry, no dead letter and no `onDeadLetter` call — Validates: FR-003
- **P-004**: under every injected fault, the provider or listener acts at most once per job, message or reference, and no work is lost — Validates: FR-004, FR-005, FR-006
- **P-005**: for every number of failed deletes of a delivered outbox message, the message keeps zero attempts, is never dead-lettered, and is delivered once the store answers — Validates: FR-007

## Architecture overview

`injectFaults` returns a `Proxy` whose `get` trap wraps each method: it counts the call, picks the first rule that
matches, records a frozen `FaultCall`, and either calls the real method on the target or rejects `before` it or after
the real promise settles. `postgresFault` returns three install statements (a sequence, a `security definer` trigger
function with an empty search path, a `before` row trigger) and three idempotent removes. In the worker, `run` keeps
only the throttle check and the attempt inside its `try`; the release or remove that records the outcome runs after it,
so a store error propagates out of `drain` and `process`.

## Components and responsibilities

- `injectFaults` (`packages/developer/testing/src/core/functions/inject-faults.function.ts`): the provider and store fault.
- `postgresFault` (`packages/developer/testing/src/core/functions/postgres-fault.function.ts`): the database fault SQL.
- `InjectedFaultError` (`packages/developer/testing/src/core/errors/injected-fault.error.ts`): the default error.
- Types (`packages/developer/testing/src/core/types/`): `FaultRule`, `FaultCall`, `FaultTiming`, `FaultInjection`,
  `PostgresFault`, `PostgresFaultOptions`, `PostgresWrite`.
- `QueueWorkerService.run` (`packages/runtime/queue/src/node/services/queue-worker.service.ts`): records outside the
  attempt's `try`.
- The six fault suites in the queue, the outbox and payments.

## Files and folders

```text
packages/developer/testing/
├── AGENTS.md
├── README.md
└── src/core/
    ├── index.ts
    ├── __tests__/index.test.ts
    ├── errors/
    │   ├── injected-fault.error.ts
    │   └── __tests__/injected-fault.error.test.ts
    ├── functions/
    │   ├── inject-faults.function.ts
    │   ├── postgres-fault.function.ts
    │   └── __tests__/{inject-faults,postgres-fault}.function.test.ts
    └── types/{fault-call,fault-injection,fault-rule,fault-timing,postgres-fault,postgres-fault-options,postgres-write}.type.ts
packages/runtime/queue/
├── AGENTS.md
└── src/node/services/
    ├── queue-worker.service.ts
    └── __tests__/queue-worker.service.fault{,.int}.test.ts
packages/runtime/outbox/
├── AGENTS.md
└── src/node/services/
    ├── outbox-relay.service.ts
    └── __tests__/outbox-relay.service.fault{,.int}.test.ts
packages/commerce/payments/
├── AGENTS.md
└── src/
    ├── core/services/__tests__/payment.service.fault.test.ts
    └── node/drivers/__tests__/postgres-payment-records.driver.fault.int.test.ts
apps/docs/src/docs/standards/testing-by-kind.mdx
.changeset/fault-injection-tier.md
```

- `packages/developer/testing/src/core/functions/inject-faults.function.ts`
- `packages/developer/testing/src/core/functions/postgres-fault.function.ts`
- `packages/developer/testing/src/core/errors/injected-fault.error.ts`
- `packages/developer/testing/src/core/index.ts`
- `packages/runtime/queue/src/node/services/queue-worker.service.ts`
- `packages/runtime/queue/src/node/services/__tests__/queue-worker.service.fault.test.ts`
- `packages/runtime/queue/src/node/services/__tests__/queue-worker.service.fault.int.test.ts`
- `packages/runtime/outbox/src/node/services/__tests__/outbox-relay.service.fault.test.ts`
- `packages/runtime/outbox/src/node/services/__tests__/outbox-relay.service.fault.int.test.ts`
- `packages/commerce/payments/src/core/services/__tests__/payment.service.fault.test.ts`
- `packages/commerce/payments/src/node/drivers/__tests__/postgres-payment-records.driver.fault.int.test.ts`

## Data models and migrations

none

## Contracts

- `injectFaults<T extends object>(target: T, rules: readonly FaultRule<keyof T & string>[]): FaultInjection<T>`.
- `FaultRule { method; calls?: number | readonly number[] | "every"; when?: "before" | "after"; error?: (call) => unknown }`.
- `FaultInjection<T> { target; calls; callsOf(method); faults(); heal() }`.
- `postgresFault(options: PostgresFaultOptions): PostgresFault` with `{ name, table, on, skip?, times?, sqlstate? }`
  and `{ install, remove, message }`.
- `InjectedFaultError(method, call, timing)`: a plain `Error`.
- `QueueWorkerService`: signatures unchanged; `drain` / `process` throw a store error raised while recording.

## Error handling

A fault rejects with the rule's error or an `InjectedFaultError`. In the worker a store error raised while recording a
finished or throttled attempt propagates; `work` already logs it as `queue.worker_failed` and pauses, and the job's
lease makes it due again.

## Security and tenancy

`postgresFault` interpolates only checked snake_case identifiers, whole numbers and a five-character SQLSTATE. The int
suites install faults as the test superuser and run the code under test as the NOBYPASSRLS service role in the owner's
isolation, so the faults strike the same writes a deployed service makes.

## Testing strategy

- AC-001: `queue-worker.service.fault.test.ts` ("fails the drain when the store cannot record a finished attempt…",
  "…removes the job and loses the answer…") and `queue-worker.service.fault.int.test.ts` ("fails the drain when the
  delete of a finished job fails…"). Reverting the worker fix fails all three.
- AC-002: "calls a provider that lost its answer again under the same Idempotency-Key".
- AC-003: `outbox-relay.service.fault.test.ts` and `.fault.int.test.ts` (a delete failure fails the tick, counts no attempt and is republished; the inbox runs once).
- AC-004: `payment.service.fault.test.ts` and `postgres-payment-records.driver.fault.int.test.ts`.
- AC-005: the kit's unit tests and `index.test.ts`.

## Rollout

A minor changeset for `@stackra/testing` and a patch for `@stackra/queue` (fixed group). The suites run in `pnpm test`
and `pnpm test:int`.

## Delegation and risk plan

One session, one branch. R-2 (an outbox delete failure counted as an attempt) is fixed in the branch after the CTO
review, with its remainder filed as STA-2915; R-3 (a pending token charge after an unsaved answer) is STA-2916.

## ADRs

ADR 0182 decisions 1, 3 and 4 (tiers, infrastructure, fault injection), ADR 0269 decision 2 (generic kit), ADR 0148
decisions 1 and 3, ADR 0136 decision 3, ADR 0078 decision 4, ADR 0357 decision 6: all Accepted.

## Docs

`packages/developer/testing/README.md`, `packages/developer/testing/AGENTS.md`, `packages/runtime/queue/AGENTS.md`,
`packages/runtime/outbox/AGENTS.md`, `packages/commerce/payments/AGENTS.md`,
`apps/docs/src/docs/standards/testing-by-kind.mdx`, `.changeset/fault-injection-tier.md`.

## Complexity tracking

none

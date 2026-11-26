---
"@stackra/testing": minor
"@stackra/queue": patch
---

The fault-injection tier of ADR 0182 decision 4 (STA-2841). `@stackra/testing` adds `injectFaults(target, rules)`, which wraps a driver, provider client or fake so the calls the rules name fail before the target acts or after it acted with the answer lost, records every call and can `heal()`; `postgresFault(options)`, the SQL of a row trigger that fails the chosen writes of one table for an integration test; and `InjectedFaultError`, with the types `FaultRule`, `FaultCall`, `FaultTiming`, `FaultInjection`, `PostgresFault`, `PostgresFaultOptions` and `PostgresWrite`. The queue, outbox and payments packages gain `.fault.test.ts` and `.fault.int.test.ts` suites over their at-least-once paths.

Fix in `@stackra/queue`: a store that failed to remove a finished job (or to release a throttled one) was counted as the job's own failure, so the worker retried, dead-lettered and ran the `onDeadLetter` compensation for work that had succeeded. The failure now fails the drain (or the delivery) and the job runs again once its lease lapses, replaying its result under the same Idempotency-Key.

---
"@stackra/actions": minor
---

Run every call in one isolation transaction (STA-1699, ADR 0495): add the `CallIsolation` port (`run(actor, scope, work,
{ readOnly })`), and the pipeline runs everything after the tenancy step inside it when one is bound, an action writable
and a query read-only. The unit of work is a savepoint of that transaction, so `afterCommit` work, the idempotency
completion, the offline cap record and the read-your-writes mark now run after the real commit, and a refused query's
usage event is written after its read-only transaction ends. With none bound a call runs as before.

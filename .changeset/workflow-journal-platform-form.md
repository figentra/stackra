---
"@stackra/workflow": minor
---

The workflow engine's journal is tenant-owned in the platform form (migration `workflow.0012_contract_journal_tenancy`):
`runs`, `steps` and `signals` get a nullable `tenant_id`, filled from `app.tenant_id` by default (a NULL row is the
platform's), forced row-level security and the platform policies. The worker's tick claims due runs and lapsed signals
across tenants through the system functions `workflow.claim_due_runs` and `workflow.claim_expired_signals` (ids,
owners and order only), then loads, advances or removes each in its owner's isolation. A run is owned by the tenant of
the call that started it, and every save runs in that owner. A claimed run that does not load, or an owned row with no
`CallIsolation` bound, fails the tick (`ClaimNotLoadedError`, `RowIsolationMissingError` from `@stackra/outbox`); a
claimed row is never skipped. `workflow.run.get` keeps its own check, and another tenant's run is now also hidden by row
security, with the same `run_not_found`.

Upgrade: finish or cancel the workflows running below a tenant node before you migrate. The migration backfills a run at
a tenant node (`nlevel(scope_path) = 3`) from its scope and keeps a run with no scope, at the root or at a product node,
as a platform run; a step takes its run's tenant, and a held signal the tenant of the waiting run that awaits it (else
its own scope's, by the same rule). It refuses, changing nothing, while a run or a held signal sits below a tenant node,
naming each count and the remedy: finish or cancel those runs and delete them (their steps go with them); let the
waiting runs take those signals, or delete them.

Breaking port changes, for a custom `WorkflowJournal` driver:

- `due` returns `RunClaim` (id, `ownerId`, `startedAt`) instead of ids; the engine loads each with `find` in its owner.
- `expire` is gone: `expired(now, limit)` claims lapsed signals (`SignalClaim`: id, `ownerId`) and `remove(ids)` deletes
  them in the session's owner.
- New `currentOwner()`: the tenant of the caller's session. `WorkflowRun` gains `ownerId`, which the journal reads back
  and never writes.

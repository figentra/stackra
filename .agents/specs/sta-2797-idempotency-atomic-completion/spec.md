# Feature Specification: an Idempotency-Key's result commits with the call

**Feature Branch**: `figentra/sta-2797-idempotency-atomic-completion`

**Created**: 2026-11-26

**Status**: Tasked

**Tier**: feature

**Approver**: the CTO (the change risk's approval stop)

**Linear**: STA-2797

**Clarifications status**: complete

**Input**: The action pipeline marked an Idempotency-Key done (`IdempotencyStore.complete`) only after the call's
transaction had committed, and freed the key (`release`) when that write failed. A short database or Valkey failure at
that point let the client's retry repeat a write that had already committed. A crash between the commit and the
completion left the key "in progress" for the whole 24-hour window. The fix changes the public `IdempotencyStore` port
in `@stackra/actions` (a lease, a holder token, a new `extend` step, and a fingerprint and window on `complete`) and
the order in which the pipeline calls it. It implements the ADR 0495 note of 2026-11-26 (decision 6) and keeps ADR
0136 decision 3 (key, payload hash and result, kept for 24 hours). Built in stackra#1092.

### Sources

- `packages/application/actions/src/contracts/ports/idempotency-store.port.ts` (the port before and after)
- `packages/application/actions/src/core/services/action-pipeline.service.ts` (`steps`, `claim`, `isolated`, the unit
  of work's commit)
- `packages/application/actions/src/core/drivers/memory-idempotency-store.driver.ts`
- `packages/application/actions/src/node/drivers/valkey-idempotency-store.driver.ts`
- `packages/data/database/src/node/drivers/postgres-idempotency-store.driver.ts`
- ADR 0495 (notes of 2026-11-01 and 2026-11-26), ADR 0136 decision 3, ADR 0138 (the idempotency step), ADR 0396
  decision 2 (the Postgres store)
- The independent review on stackra#1092 (two low follow-ups, listed under Known risks in plan.md)

## Impact

- **Apps touched**: docs only (the ADR 0495 note of 2026-11-26)
- **Services touched**: none
- **Packages touched**: actions (the `IdempotencyStore` port, the memory and Valkey drivers, the action pipeline, two
  new constants `IDEMPOTENCY_LEASE` and `IDEMPOTENCY_STORE_FAILED`, tests, README, AGENTS.md); database (the Postgres
  idempotency driver, its int test, README)
- **Public contract change**: `IdempotencyStore.claim(key, fingerprint, lease, holder)`; new
  `IdempotencyStore.extend(key, fingerprint, ttl, holder): Promise<boolean>`;
  `IdempotencyStore.complete(key, fingerprint, output, ttl, holder)`; `IdempotencyStore.release(key, holder)`.
  `completeRefused` is unchanged. Breaking for any implementer of the port; the three shipped drivers are updated.
  Callers of the pipeline see no signature change.
- **Cross-service events**: none
- **Tenancy and data**: no migration and no new column; the Postgres store's existing `database.idempotency_keys`
  table gets upserts for `extend` and `complete`. Keys stay scoped per tenant as before; the holder token is a random
  UUID per call and is not stored by the Postgres driver.
- **Security and privacy**: no personal data added; the new log event carries the action key, call id, step and
  cause, never the input or output
- **Secrets**: none
- **ADR needed**: no new ADR; implements the ADR 0495 note of 2026-11-26 (decision 6), added in this branch
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/application/actions/README.md`, `packages/application/actions/AGENTS.md`,
  `packages/data/database/README.md`, the ADR 0495 note, a changeset
- **Lane**: full
- **Change risk**: R2 (a breaking signature change to a public port that guards against duplicate writes; no auth,
  tenancy, secret or HTTP shape change)

## Acceptance criteria

- **AC-001**: WHEN a keyed action runs on a store that joins transactions, THE pipeline SHALL write the key's result
  inside the call's transaction, after the interceptors, so the result commits or rolls back with the action's writes
  (`joinsTransaction`: the Postgres store).
- **AC-002**: WHEN a keyed call has no `CallIsolation` or outer transaction, THE pipeline SHALL run its steps in one
  `UnitOfWork` transaction, provided the bound store joins transactions.
- **AC-003**: WHEN a keyed action runs on a store that cannot join, THE pipeline SHALL extend the call's claim to the
  replay window (`IdempotencyStore.extend`) as the last step before the call's commit (the Valkey and memory stores).
- **AC-004**: IF `extend` answers false or the store cannot be reached at that step THEN THE pipeline SHALL fail the
  call with `idempotency_key_in_progress` inside the transaction, so the call's writes roll back.
- **AC-005**: IF the store's completion fails after the call committed THEN THE pipeline SHALL return the call's
  output, log `actions.idempotency_store_failed`, and leave the key held for the replay window.
- **AC-006**: WHEN a call's writes have committed, THE pipeline SHALL never release its key, including when an
  interceptor fails after the action's own unit of work committed.
- **AC-007**: WHEN a call fails before anything committed, THE pipeline SHALL release the key for that call's holder,
  so a retry runs.
- **AC-008**: THE pipeline SHALL claim a key for `IDEMPOTENCY_LEASE` (15 minutes, never longer than the replay window)
  and keep a completed key for the replay window.
- **AC-009**: THE memory and Valkey drivers SHALL extend, complete or release a key only while it holds the given
  holder's claim, or, for `extend` and `complete`, while it is free.
- **AC-010**: THE Postgres driver SHALL extend or complete a key only while it is held for the same fingerprint, or
  lapsed or missing, and SHALL never free a done key.

## Status history

- 2026-11-26 → Clarified (the duplicate-write path and the 24-hour stuck key, from the STA-2797 report)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md; built in the same branch, stackra#1092)

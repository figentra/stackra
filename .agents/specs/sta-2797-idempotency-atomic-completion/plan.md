# Implementation Plan: an Idempotency-Key's result commits with the call

**Spec**: `.agents/specs/sta-2797-idempotency-atomic-completion/spec.md` · **Linear**: STA-2797 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2797-idempotency-atomic-completion/spec.md`

## Summary

The `IdempotencyStore` port gains a lease, a per-call holder token and an `extend` step, and `complete` takes the
fingerprint, the replay window and the holder. The pipeline completes a store that joins transactions inside the
call's transaction, and re-confirms the claim of any other store as the last step before the commit. After a commit it
never frees the key. A committed call can therefore never run twice, and a call that died before its commit frees its
key after 15 minutes instead of 24 hours.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/application/actions`, `packages/data/database`
- **Testing**: vitest unit tests in `src/**/__tests__/`; the Postgres int test against a real database
- **Storage**: the existing `database.idempotency_keys` table (Postgres), Valkey keys under `idempotency:`, memory
- **Runtime target**: every member that runs actions through `ActionPipeline`

## Constitution Check

| Law                                   | Result | Note                                                                  |
| ------------------------------------- | ------ | --------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | database already implements the actions port; no new import direction |
| Secrets (ADR 0009)                    | PASS   | none read or written                                                  |
| Security                              | PASS   | closes a duplicate-write path; the log event carries no input/output  |
| HTTP and events                       | N/A    | no route, header or event shape changes                               |
| Tenancy                               | PASS   | keys stay scoped per tenant as before                                 |
| Delegation                            | PASS   | Claude only                                                           |
| Not built yet (ADR 0011)              | N/A    | none                                                                  |
| Test placement (ADR 0022)             | PASS   | tests stay in `__tests__/`                                            |
| Versions and catalogs                 | PASS   | a minor changeset for actions and database                            |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                     |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                             |
| Docs and ADRs                         | PASS   | ADR 0495 note, both READMEs, actions AGENTS.md                        |

## Deploy modes

| Mode       | Behaviour                                                                    |
| ---------- | ---------------------------------------------------------------------------- |
| SaaS       | same pipeline; Valkey or Postgres store as `config.actions.stores` selects   |
| On-prem    | same; a deployment with no Valkey uses the Postgres store (atomic path)      |
| Air-gapped | same; no external call is added, the memory store keeps the lease and holder |

## Correctness properties

- **P-001**: on the Postgres store a call whose completion fails rolls its writes back, and the retry runs once —
  Validates: AC-001
- **P-002**: with no isolation bound, a keyed call on a joining store runs in exactly one `UnitOfWork` transaction —
  Validates: AC-002
- **P-003**: on memory or Valkey, `extend` is the last store call before the commit and keeps the key held past the
  lease — Validates: AC-003, AC-008
- **P-004**: a call that outran its lease after another call took the key rolls back, so only one write commits —
  Validates: AC-004
- **P-005**: a failed completion after the commit returns the output, logs `actions.idempotency_store_failed`, and a
  retry is told `idempotency_key_in_progress` — Validates: AC-005, AC-006
- **P-006**: a call that failed before its commit frees its key, and the retry runs — Validates: AC-007
- **P-007**: no driver write touches another holder's claim or a done record — Validates: AC-009, AC-010

## Architecture overview

`ActionPipeline.steps` claims the key inside the call's isolation (or inside a `UnitOfWork` transaction it opens for a
keyed call on a joining store). The order of store calls is:

1. `claim(key, fingerprint, lease, holder)`.
2. `handle` and the interceptors.
3. One of two steps, by store. A joining store gets `complete(...)` inside the transaction. Any other store gets
   `extend(key, fingerprint, ttl, holder)`, the last step before the commit.
4. The commit.
5. For a store that cannot join, `complete(...)` after the commit. A failure there is logged, and the key stays held
   because the extend in step 3 already covers the window.

The pipeline never calls `release` once the call's writes have committed (`CallState.committed`, `CallState.enclosed`).

## Components and responsibilities

- `IdempotencyStore` (port): the contract above. `claim` is atomic per key. `extend` answers false when the claim was
  lost. `complete` writes when the holder holds the key or it is free. `release` frees only the holder's claim.
- `ActionPipeline`: `wrapsKeyedCall` decides whether to open the `UnitOfWork`, `confirmed` runs the extend step, and
  `storeSafely` logs failures of store writes after the outcome is fixed. The holder is `crypto.randomUUID()` per claim.
- `MemoryIdempotencyStoreDriver`, `ValkeyIdempotencyStoreDriver`: keep the holder. The Valkey held record starts with
  `{"holder":…`, and the `WRITE_HELD` and `RELEASE` Lua scripts act only on that prefix or a free key.
- `PostgresIdempotencyStoreDriver`: joins transactions and keeps no holder, because its claim row never commits before
  its call. `extend` and `complete` are upserts guarded by fingerprint and expiry.
- `IDEMPOTENCY_LEASE` (15 minutes) and `IDEMPOTENCY_STORE_FAILED` (`actions.idempotency_store_failed`): new constants.

## Files and folders

```text
packages/application/actions/
  AGENTS.md
  README.md
  src/contracts/ports/idempotency-store.port.ts
  src/contracts/ports/__tests__/idempotency-store.port.test.ts
  src/core/constants/idempotency-lease.constant.ts
  src/core/constants/idempotency-store-failed.constant.ts
  src/core/drivers/memory-idempotency-store.driver.ts
  src/core/drivers/__tests__/memory-idempotency-store.driver.test.ts
  src/core/services/action-pipeline.service.ts
  src/core/services/__tests__/action-pipeline.service.test.ts
  src/node/drivers/valkey-idempotency-store.driver.ts
  src/node/drivers/__tests__/valkey-idempotency-store.driver.test.ts
packages/data/database/
  README.md
  src/node/drivers/postgres-idempotency-store.driver.ts
  src/node/drivers/__tests__/postgres-idempotency-store.driver.int.test.ts
apps/docs/src/docs/adr/0495-every-call-and-background-unit-runs-in-a-transaction-local-isolation-context.mdx
.changeset/idempotency-result-commits-with-the-call.md
```

## Data models and migrations

None. The Postgres table is unchanged; `extend` and `complete` are `insert … on conflict (key) do update … where`
upserts on it. Valkey held records now begin with the holder: `{"holder":…,"fingerprint":…,"done":false}`. Done
records keep their earlier shape.

## Contracts

The port in `packages/application/actions/src/contracts/ports/idempotency-store.port.ts`, exported from
`@stackra/actions/contracts`:

```ts
abstract claim(key: string, fingerprint: string, lease: Duration, holder: string): Promise<IdempotencyRecord | undefined>;
abstract extend(key: string, fingerprint: string, ttl: Duration, holder: string): Promise<boolean>;
abstract complete(key: string, fingerprint: string, output: unknown, ttl: Duration, holder: string): Promise<void>;
abstract release(key: string, holder: string): Promise<void>;
```

- **Implementers**: this is a breaking change for any third-party driver. Migration: take the lease in `claim` and
  store the holder. Add `extend`. Have `complete` write the done record for `ttl` from now, only while this holder holds
  the key or it is free. Have `release` act only on the holder's claim. A driver that joins transactions may ignore the
  holder, as the Postgres driver does.
- **Callers**: no change to `ActionPipeline`'s API or to the HTTP Idempotency-Key behaviour. There is one new outcome:
  a call that outran its lease after another call took the key now fails with `idempotency_key_in_progress` and rolls
  back, where before it wrote a second time. A retry replays the other call's answer.
- **Operators**: watch the new log event `actions.idempotency_store_failed`, with fields `key`, `callId`, `step` and
  `cause`.

## Error handling

- A lost claim at `extend`, or a store failure there, throws `IdempotencyKeyInProgressError` inside the transaction.
  The writes roll back, and the key is released for the holder when the store allows it.
- After the commit, a failure of `complete`, `completeRefused` or `release` is logged as `IDEMPOTENCY_STORE_FAILED` and
  never changes the call's answer.
- A non-retryable refusal on a caller-sent key is still kept with `completeRefused`, written after the rollback.

## Security and tenancy

The fix closes the duplicate-write path: an order or payment written twice from one Idempotency-Key. Keys stay scoped
by tenant through the existing `claim` key scoping. The holder is a random per-call token that never leaves the
process, except as a prefix of the Valkey record. The log event names no input or output value.

## Testing strategy

- AC-001: `action-pipeline.service.test.ts` ("completes a joining store inside the call's transaction…") and
  `postgres-idempotency-store.driver.int.test.ts` ("rolls the order back when the completion fails…", with and without
  an isolation).
- AC-002: "opens one unit of work around a keyed call on a joining store when no isolation is bound".
- AC-003, AC-008: "holds a running call's key for the lease and keeps the output for the replay window" and "keeps a
  committed call's key held past the lease when the process dies before completing it".
- AC-004: "rolls back a call that outran its lease after a retry took the key…", "commits a call that outran its lease
  when no other call took the key…" and "rolls the call back when the claim cannot be re-confirmed before the commit".
- AC-005, AC-006: "returns the output and keeps the key held when a store's completion fails after the commit", "keeps
  the key held when an interceptor fails after the action's own unit of work committed" and its past-the-lease twin,
  and "replays a call that committed when something fails after the commit…" (pipeline and Postgres).
- AC-007: "frees the key of a call that failed before its commit, so the retry runs".
- AC-009: the memory driver tests (lease, late completion, extend, release by holder only) and the Valkey driver tests
  (claim, complete and release; extend; late completion).
- AC-010: the Postgres int tests in the "lease and window" block.
- The port test drives a stand-in driver through `claim`, `extend`, `complete` and `release`. The PR reports that each
  behaviour test fails with the change reverted.

## Rollout

- A minor changeset for `@stackra/actions` and `@stackra/database`, which notes the port break for implementers.
- No data migration.
- Valkey keys held by the previous version keep their 24-hour expiry. A new claim reads such a key as in progress until
  it expires, and the new scripts never overwrite it, because its prefix is not this call's holder. Done records
  written by the previous version replay as before.
- To roll back, revert the release. Records written by the new version still parse, because the holder field is
  ignored on read.

## Known risks

- Review follow-up (low): `completeRefused` still writes unconditionally on Valkey and memory and takes no holder. Call
  A outruns its lease, call B claims the key, and A then ends with a non-retryable refusal. A's refusal overwrites B's
  claim. No duplicate write results, but retries may replay A's refusal. The fix is to pass the holder and use the
  `WRITE_HELD` script, as `complete` does.
- Review follow-up (low): the file contract of `idempotency-ttl.constant.ts` still says `IDEMPOTENCY_TTL` is passed to
  `claim`. It is now passed to `extend`, `complete` and `completeRefused`.
- The remaining window is a crash after `extend` and before the commit. It leaves a key held for the window with
  nothing written: a retry answers `idempotency_key_in_progress`, never a duplicate.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2: the change waits for the CTO's approval stop before it merges.

## ADRs

ADR 0495, note of 2026-11-26 (decision 6), added in this branch; ADR 0136 decision 3 is kept.

## Docs

`packages/application/actions/README.md`, `packages/application/actions/AGENTS.md`, `packages/data/database/README.md`,
the ADR 0495 note.

## Complexity tracking

none

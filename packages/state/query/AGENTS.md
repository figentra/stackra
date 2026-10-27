# AGENTS — @stackra/query

Server state on the client: the live TanStack Query cache, the offline mutation queue, the bounded replicas and the
offline lock (ADR 0338). Member at
`packages/state/query` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./devtools`, `./react`, `./testing`.

## Where code goes

| You are writing…                               | It goes in…                                    |
| ---------------------------------------------- | ---------------------------------------------- |
| A port or a type it names                      | `src/contracts/{ports,types}/`                 |
| The configuration                              | `src/config/query.config.ts`                   |
| A persister driver                             | `src/core/drivers/<name>.driver.ts`            |
| The queue, the cache, the replicas or the lock | `src/core/services/`                           |
| A record type of the queue                     | `src/core/types/` (exported from `./react`)    |
| React code                                     | `src/react/<name>/`                            |
| A test helper                                  | `src/testing/functions/`                       |
| A test                                         | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## This package

- No sync engine (ADR 0227). Offline writes are action calls replayed with the Idempotency-Key minted at queue time.
  A `client_retry` mints a new key, because the old key would replay the stored refusal.
- A conflict is a record a person resolves, never a silent overwrite (ADR 0059 decision 3).
- Never write "tenant": the cache and the queue are keyed by the principal and a contracts `ScopeRef` (R-59).
- The cache lives in memory only. Replicas persist only through an encrypting persister while `persistEncrypted` is
  on; a query that is not a declared replica is not available offline. The queue is always persisted, sealed, and
  `enqueue` resolves only once the call is durable.
- Per-device order (ADR 0338 decision 1): one call in flight at a time, in queue order, each with its device id and a
  sequence stamped at its first send. Never send a later call before an earlier one was answered.
- A capped action is refused with `@stackra/actions`' `OfflineCapReachedError`, never a refusal of this package: the
  client and the pipeline share one code. Every waiting call and every accepted call within the window counts.
- `OfflineLock` is the only code that clears the `outbox`, `cache` and `secrets` areas; every store that holds offline
  data closes on its `onWipe`, and a store that keeps data in memory empties it there.
- The query hooks of the generated client belong to `@stackra/clients/react`, not here. The `QueueLeader` drivers
  belong to `@stackra/coordinator`; the `MutationSender`, `ReplicaSource` and `AcknowledgementReader` drivers to
  `@stackra/clients`; the `OfflineSession` driver to `@stackra/identity`.
- `./contracts` imports no other entry. `src/*/index.ts` are stand-in barrels until gen writes them (STA-339).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## Devtools

- `./devtools` is the dev-only devtools entry (ADR 0246 decision 4): `defineQueryDevtools(kit, cache, queue)` defines `query.cache` and the sensitive `query.mutations` on the kit, data only. No
  UI, no `@stackra-pro/*` import (ADR 0461: the panel UI is Pro, the data is free). Nothing in `.` or a production path
  imports `./devtools`.
- It takes the kit by shape, `DevtoolsTabSink` from `@stackra/container/devtools`, never `@stackra/devtools-kit`
  (the kit depends on container and events, so a dependency on it would close a cycle).
- Tab ids are dotted lowercase, `query.*` first. A tab that carries inputs, payloads or personal data sets
  `sensitive: true`.
- ADR 0127 does not list `./devtools` among the allowed entries and gen's `entryOf` does not know it yet; the barrel
  is a hand-written stand-in until both are settled (see the stackra-208 hand-off).

## PII

| Data                              | Where                                       | Handling                                                                                                                                               |
| --------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Query results (may hold PII)      | memory only                                 | Emptied on every partition switch and on a wipe                                                                                                        |
| Replica records (may hold PII)    | `cache` area, keyed by principal and scope  | Sealed; persisted only through an encrypting persister while `persistEncrypted` is on; dropped after max age, on a wipe and outside the device's slice |
| Queued call inputs (may hold PII) | `outbox` area, keyed by principal and scope | Sealed; kept until sent, resolved or discarded; never replayed for another principal; wiped on revoke or past the offline limit                        |
| Accepted capped calls             | `outbox` area, with the queue               | Action key, time and amount only; dropped once their window passes                                                                                     |
| Last sync time                    | `prefs` area                                | A timestamp only; removed by a wipe                                                                                                                    |
| Principal and scope ids           | storage keys                                | Ids only (public ids and scope codes)                                                                                                                  |

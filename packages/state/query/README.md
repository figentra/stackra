# @stackra/query

Stackra server state on the client. The package holds the TanStack Query cache, refetched live; the offline mutation
queue, with idempotency keys, per-device order, caps and conflict records; the bounded replicas that keep a query
available offline with its "as of" time; the offline lock that wipes a revoked or long-offline device; the offline
map; the `QueryConfig` configuration with its shipped schema and the `QuerySettings`; the `useMutationQueue` and
`useReplica` hooks; and the `fakeQueue` test helper.

**Tier:** `tier:lib` (`packages/state/query`). Entries `.`, `./contracts`, `./devtools`, `./react` and `./testing`. Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`, `@stackra/errors`,
`@stackra/actions` (the offline enums and the cap refusal), `@stackra/storage`, `@stackra/platform` (the network
signal), `@stackra/realtime` (live refetch and refresh signals), `@stackra/devices` (the device id),
`@stackra/settings` (the offline limit), `@tanstack/query-core` and zod. React is an optional peer for `./react`.

The query hooks of the generated client (`useQuery`, `useInfiniteQuery`, `useQueryClient`) live in
`@stackra/clients/react`, and so do the drivers of this package's offline ports. This package has no sync engine:
offline writes go through a mutation queue with idempotency keys, and offline reads through declared replicas
(ADR 0227, 0338).

## What is here

| Entry         | Symbol                                                   | Use                                                                                     |
| ------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `.`           | `QueryConfig`, `QueryConfig$`, `QueryOptions`            | key `query`: scope, persisted replicas, queue replay, leader, retention, read rules     |
| `.`           | `QuerySettings`                                          | the tenant setting `offlineLimitHours` (24 by default, lockable)                        |
| `.`           | `QueryScope`                                             | what the cache and the queue are keyed by: `active_scope` (default) or `principal`      |
| `.`           | `offlineMap`, `OfflineEntry`, `OfflineMap`, `OfflineCap` | gen calls it in `#stackra/offline`; `Offline.for(action)` reads a policy                |
| `.`           | `MutationQueue`                                          | the offline queue: `open`, `enqueue`, `drain`, `resolve`, `discard`                     |
| `.`           | `ReplicaStore`, `registerReplicas`                       | the bounded replicas: `open(partition, slice)`, `read`, `refresh`                       |
| `.`           | `ReplicaOptions`, `ReplicaRef`                           | a query's `replica: { of, window, limit, scope? }` and the class that declares it       |
| `.`           | `OfflineLock`                                            | revoke and the offline limit wipe `outbox`, `cache` and `secrets` and lock              |
| `.`           | `ServerStateCache`                                       | the TanStack client, `open(partition)` and `watch(query)` for live queries              |
| `.`           | `StorageQueryPersisterDriver`                            | the `storage` driver of `QueryPersister`, sealed with `@stackra/storage`'s seal         |
| `.`           | `OfflineError`                                           | `offline`: the action is online-only and may not be queued                              |
| `./contracts` | `QueryPersister`, `QueueLeader`                          | where the replicas and the queue are kept; which tab drains                             |
| `./contracts` | `MutationSender`, `DeviceOrder`, `ReplayOutcome`         | how a queued call is sent with its device order; `@stackra/clients` implements it       |
| `./contracts` | `ReplicaSource`, `ReplicaChanges`, `ReplicaRow`          | how a replica's changes since a cursor are read; `@stackra/clients` implements it       |
| `./contracts` | `AcknowledgementReader`                                  | the device's last acknowledged sequence, the read that counts as a sync                 |
| `./contracts` | `OfflineSession`                                         | revoked and signed-in signals and the local sign-out; `@stackra/identity` implements it |
| `./react`     | `useMutationQueue`                                       | the queue in a component: `pending`, `items`, `conflicts`, `isDraining`, actions        |
| `./react`     | `PendingMutation`, `ConflictRecord`                      | the queue's records                                                                     |
| `./react`     | `useReplica`, `ReplicaSnapshot`                          | a replica in a component: `{ data, asOf }`                                              |
| `./testing`   | `fakeQueue`                                              | a `QueueFake` seeded with `{ pending, conflicts }`                                      |

## The offline queue

The generated `#stackra/offline` lists every consumed action whose producer declared `offline`. Any other action is
online-only, and `enqueue` refuses it with `OfflineError`.

```ts
await queue.open({ principal: session.user.userId, scope: activeScope }); // after sign-in, on every switch
await queue.enqueue(CreateOrderAction, input, input.orderId); // persisted, sealed, before it resolves
```

- Each call gets an Idempotency-Key (`crypto.randomUUID()`) and the device's id (`DeviceIdentity`) when it is queued,
  and every replay sends that key. A replay after a lost answer is therefore the same call to the pipeline's
  idempotency step.
- Per-device order (ADR 0338 decision 1): the queue sends one call at a time, in the order they were queued. A call
  takes the device's next sequence number when it is first sent and keeps it on every resend. A later call is never
  sent before an earlier one was accepted or refused, so a call that did not reach the server stops the replay.
- The queue replays only while this context leads (`QueueLeader`) and the network is up. With `replayOnReconnect`,
  it replays on its own when either signal turns on.
- A send that never reached the server keeps the call; offline, `401`, `429` and `5xx` count as not reached.
- A refusal for good, or a call older than its retention (`stale_offline_mutation`), becomes a `ConflictRecord`. The
  record holds the call and the server's record. Later calls on the same aggregate wait behind it; the other
  aggregates go on. Nothing is overwritten silently.
- `resolve(id, server_wins)` drops the local intent. `resolve(id, client_retry)` queues the call again with a new key,
  but only when the action offers that resolution. `manual` leaves the record for a person, and `discard(id)` always
  works.

## Caps

`OfflineCap` is `@stackra/actions`' own type, so the client and the pipeline read the same `amountField`. An action
whose `offline` option declares `cap: { count, amount, amountField?, window }` is refused offline once the
cap is reached (ADR 0338 decision 5), with the pipeline's own refusal, `@stackra/actions`' `OfflineCapReachedError`
(`offline_cap_reached`). The queue counts every call of the action still waiting, whatever its age (the server counts
it when it applies it), and the capped calls the server accepted within the window, which it keeps with the queue
across a restart. The amount is read from the input's `amountField` (`amount` by default): minor units, or a `Money`
wire form. The server reconciles the capped calls on sync with the same code, so a replay it refuses becomes a
conflict record.

## Replicas

A query is available offline only when its producer declared it a replica (ADR 0338 decision 3). The generated query
class carries the declaration (`queryRef(key, { replica })` in `@stackra/clients` records it with `registerReplicas`),
and a screen reads it with its "as of" time:

```tsx
const { data, asOf } = useReplica(RecentSalesQuery); // `asOf` is null until the first fill
return <Caption>{t(I18n.sales.replica.asOf, { asOf })}</Caption>;
```

- `replicas.open(partition, { legalEntityId })` after sign-in and on every switch restores what was persisted and
  refreshes each replica. The first fill is the only full download; later refreshes send the opaque cursor the server
  returned and merge the rows changed and the ids removed since it, on `open`, on every reconnect and on each broadcast
  of the query's refresh signal (`invalidateOn`).
- While the phone saves (Low Power Mode or an expensive connection, `SystemSettings` of `@stackra/platform`), the
  refreshes on `open`, reconnect and the refresh signal wait and run once it stops; an explicit `refresh` still runs.
  The offline mutation queue does not wait: a person's writes leave as soon as the network allows.
- A replica keeps the records within its `window` (by each record's `at`) and at most `limit` of them, newest first.
- A replica with a `scope` dimension asks only for the device's slice and drops any record outside it; a device with no
  slice of that dimension keeps none.
- Replicas persist in the sealed `cache` area only through an encrypting persister while `persistEncrypted` is on, and
  a stored replica older than `persistMaxAgeHours` refills. A failed refresh keeps what the replica holds and its
  "as of" time.

## Wipe and lock

`OfflineLock` (ADR 0338 decision 4) wipes the device's offline data when identity revokes its session, or when the
offline limit (`QuerySettings.offlineLimitHours`, 24 hours by default) passes without a sync. A sync is an answer to the
device's last acknowledged sequence (`AcknowledgementReader`), asked on start, on every reconnect, on every sign-in and
when the limit falls due.

- A wipe tells the queue, the cache and the replicas to drop what they hold, then clears the `outbox`, `cache` and
  `secrets` areas. With the payload key gone from `secrets`, nothing sealed before can be opened again.
- Past the offline limit the lock also ends the session on the device. Either way it stays locked until someone signs
  in again; `isLocked`, `lastSyncedAt` and `lastAcknowledged` are what a screen shows.
- A revoked device's unsent calls are lost by design; the server lists its last acknowledged sequence, so the loss is
  known.

## The cache

`ServerStateCache.client` is a TanStack Query `QueryClient`. It takes its defaults from `QueryConfig`: fresh time,
retries and refetch on focus. Every cache key starts with the query's versioned key: `[OrderKpisQuery.key, input]`.

- `open(partition)` empties the client, so another principal's or scope's results never show. A wipe empties it too.
- The cache lives in memory only. What a device keeps across a restart is its replicas.
- `watch(OrderKpisQuery)` makes a query live: each broadcast of an event in its `invalidateOn` invalidates the
  query's results, which refetches the ones on screen. The subscription goes through `@stackra/realtime`'s
  connection.

## Wiring the offline stack

The host's query context binds the ports and starts the lock once:

| Port                    | Driver                                                        |
| ----------------------- | ------------------------------------------------------------- |
| `QueryPersister`        | `StorageQueryPersisterDriver`, over `@stackra/storage`'s seal |
| `MutationSender`        | `@stackra/clients`' `ClientMutationSenderDriver`              |
| `ReplicaSource`         | `@stackra/clients`' `ClientReplicaSourceDriver`               |
| `AcknowledgementReader` | `@stackra/clients`' `ClientAcknowledgementReaderDriver`       |
| `OfflineSession`        | `@stackra/identity`'s `SessionOfflineSessionDriver`           |
| `QueueLeader`           | `@stackra/coordinator`'s drivers                              |

```ts
lock.start(); // once
await Promise.all([queue.open(partition), replicas.open(partition, { legalEntityId })]); // after sign-in
cache.open(partition);
```

## Overriding

```ts
// apps/console/src/config/query.config.ts
import type { DriverName } from "@stackra/container";
import { QueryConfig as BaseQueryConfig, QueryScope } from "@stackra/query";
import type { QueueLeader } from "@stackra/query/contracts";

export class QueryConfig extends BaseQueryConfig {
  override scope: QueryScope = QueryScope.ActiveScope;
  override queueLeader: DriverName<QueueLeader> = "broadcast_channel";
  override staleTimeSeconds = 30;
}
```

## Devtools

`@stackra/query/devtools` is the dev-only entry (ADR 0246 decision 4). `defineQueryDevtools(kit, cache, queue)` defines
two tabs on the devtools kit and returns their remover:

| Tab               | Shows                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `query.cache`     | each cached query by its versioned key: status, fetch status, stale, observers, last update |
| `query.mutations` | `sensitive`: the offline queue's pending calls, conflicts and whether it is draining        |

The cache tab never shows a query's input or data. The mutations tab carries call inputs, so the kit withholds it from
a host that did not accept sensitive tabs. The kit is taken by shape (`DevtoolsTabSink` from
`@stackra/container/devtools`).

## Testing

```ts
render(<OfflineBanner />, { queue: fakeQueue({ pending: 2 }) });
```

The fake is a real `MutationQueue` that never reaches a server, so a drain keeps every call. Bind it in place of
`MutationQueue`.

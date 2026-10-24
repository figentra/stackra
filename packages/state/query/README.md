# @stackra/query

Stackra server state on the client. The package holds the TanStack Query cache, persisted per partition and refetched
live; the offline mutation queue, with idempotency keys, per-aggregate order and conflict records; the offline map;
the `QueryConfig` configuration with its shipped schema; the `useMutationQueue` hook; and the `fakeQueue` test helper.

**Tier:** `tier:lib` (`packages/state/query`). Entries `.`, `./contracts`, `./react` and `./testing`. Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`, `@stackra/errors`,
`@stackra/actions` (the offline enums), `@stackra/storage`, `@stackra/platform` (the network signal),
`@stackra/realtime` (live refetch), `@tanstack/query-core` and zod. React is an optional peer for `./react`.

The query hooks of the generated client (`useQuery`, `useInfiniteQuery`, `useQueryClient`) live in
`@stackra/clients/react`. This package has no sync engine: offline writes go through a mutation queue with
idempotency keys (ADR 0227).

## What is here

| Entry         | Symbol                                        | Use                                                                                 |
| ------------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `.`           | `QueryConfig`, `QueryConfig$`, `QueryOptions` | key `query`: scope, persisted cache, queue replay, leader, retention, read defaults |
| `.`           | `QueryScope`                                  | what the cache and the queue are keyed by: `active_scope` (default) or `principal`  |
| `.`           | `offlineMap`                                  | gen calls it in `#stackra/offline`; `Offline.for(action)` reads a policy            |
| `.`           | `MutationQueue`                               | the offline queue: `open`, `enqueue`, `drain`, `resolve`, `discard`                 |
| `.`           | `ServerStateCache`                            | the TanStack client, `open(partition, buster)` and `watch(query)` for live queries  |
| `.`           | `StorageQueryPersisterDriver`                 | the `storage` driver of `QueryPersister`, over `@stackra/storage`                   |
| `.`           | `OfflineError`                                | `offline`: the action is online-only and may not be queued                          |
| `./contracts` | `QueryPersister`, `QueueLeader`               | where the cache and the queue are kept; which tab drains                            |
| `./contracts` | `MutationSender`, `ReplayOutcome`             | how a queued call is sent; `@stackra/clients` implements it                         |
| `./react`     | `useMutationQueue`                            | the queue in a component: `pending`, `items`, `conflicts`, `isDraining`, actions    |
| `./react`     | `PendingMutation`, `ConflictRecord`           | the queue's records                                                                 |
| `./testing`   | `fakeQueue`                                   | a `QueueFake` seeded with `{ pending, conflicts }`                                  |

## The offline queue

The generated `#stackra/offline` lists every consumed action whose producer declared `offline`. Any other action is
online-only, and `enqueue` refuses it with `OfflineError`.

```ts
await queue.open({ principal: session.user.userId, scope: activeScope }); // after sign-in, on every switch
await queue.enqueue(CreateOrderAction, input, input.orderId); // persisted before it resolves
```

- Each call gets an Idempotency-Key (`crypto.randomUUID()`) when it is queued, and every replay sends that key.
  A replay after a lost answer is therefore the same call to the pipeline's idempotency step.
- Calls on one aggregate replay first in, first out. Up to `maxParallelAggregates` aggregates replay at once.
- The queue replays only while this context leads (`QueueLeader`) and the network is up. With `replayOnReconnect`,
  it replays on its own when either signal turns on.
- A send that never reached the server keeps the call; offline, `401`, `429` and `5xx` count as not reached.
- A refusal for good, or a call older than its retention (`stale_offline_mutation`), becomes a `ConflictRecord`. The
  record holds the call and the server's record. Later calls on the same aggregate wait behind it. Nothing is
  overwritten silently.
- `resolve(id, server_wins)` drops the local intent. `resolve(id, client_retry)` queues the call again with a new key,
  but only when the action offers that resolution. `manual` leaves the record for a person, and `discard(id)` always
  works.

## The cache

`ServerStateCache.client` is a TanStack Query `QueryClient`. It takes its defaults from `QueryConfig`: fresh time,
retries and refetch on focus. Every cache key starts with the query's versioned key: `[OrderKpisQuery.key, input]`.

- `open(partition, buster)` empties the client. It then restores what was stored under the same buster (the client
  manifest hash) if that is younger than `persistMaxAgeHours`, and persists later changes one second after they
  settle.
- With `persistEncrypted` on (the default), the cache is persisted only through a persister that encrypts. The
  `storage` driver reports no encryption, so with it the cache stays in memory. The queue is always persisted.
- `watch(OrderKpisQuery)` makes a query live: each broadcast of an event in its `invalidateOn` invalidates the
  query's results, which refetches the ones on screen. The subscription goes through `@stackra/realtime`'s
  connection.

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

## Testing

```ts
render(<OfflineBanner />, { queue: fakeQueue({ pending: 2 }) });
```

The fake is a real `MutationQueue` that never reaches a server, so a drain keeps every call. Bind it in place of
`MutationQueue`.

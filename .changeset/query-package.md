---
"@stackra/query": minor
---

Add `@stackra/query`, server state on the client: a TanStack Query cache refetched live on its queries' invalidation events, an offline mutation queue that replays in per-device order with the Idempotency-Key minted at queue time, refuses a capped action with the pipeline's `offline_cap_reached` and turns refusals into conflict records, bounded replicas refreshed by change cursor that `useReplica` reads with their "as of" time, an `OfflineLock` that wipes and locks a revoked or long-offline device, payloads sealed at rest, `offlineMap`, `QueryConfig` with its shipped schema, `QuerySettings`, `useMutationQueue` and `fakeQueue`.

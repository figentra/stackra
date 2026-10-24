---
"@stackra/query": minor
---

Add `@stackra/query`, server state on the client: a TanStack Query cache persisted per principal and scope and refetched live on its queries' invalidation events, an offline mutation queue that replays each aggregate in order with the Idempotency-Key minted at queue time and turns refusals into conflict records, `offlineMap`, `QueryConfig` with its shipped schema, `useMutationQueue` and `fakeQueue`.

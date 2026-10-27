---
"@stackra/clients": minor
---

`RetryOn` moves to @stackra/contracts (`./server` re-exports it). `createPublicClients`' `retry` is the contracts
`RetryPolicy`: `on` became `retryOn`. (stackra-223)

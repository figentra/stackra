---
"@stackra/query": minor
---

Add the dev-only `./devtools` entry: `defineQueryDevtools(kit, cache, queue)` defines the `query.cache` devtools tab
(cached queries by versioned key, no input or data) and the sensitive `query.mutations` tab (the offline queue's
pending calls and conflicts) (stackra-208, ADR 0246, ADR 0461).

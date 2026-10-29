---
"@stackra/gen": minor
---

Register the generated report queries (`#stackra/reports`) and search queries (`#stackra/search`) like authored
queries: each gets its manifest entry, derived endpoint, MCP tool and wiring binding (`reportQueriesOf`,
`searchQueriesOf`). The manifest records a query's `reads`, so a service's wiring reaches `ReplicaReads` for a hosted
package's replica query too.

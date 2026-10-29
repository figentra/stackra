---
"@stackra/gen": minor
"@stackra/loyalty-kit": patch
---

Register the generated report queries (`#stackra/reports`) and search queries (`#stackra/search`) like authored
queries: each gets its manifest entry, derived endpoint, MCP tool and wiring binding (`reportQueriesOf`,
`searchQueriesOf`), with the package input and output schemas under the module's `schemas`. The loyalty-kit manifest
lists its `loyalty_kit.loyalty_account.search@1` query. The manifest records a query's `reads`, so a service's wiring reaches `ReplicaReads` for a hosted
package's replica query too.

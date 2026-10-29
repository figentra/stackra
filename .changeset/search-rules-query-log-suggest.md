---
"@stackra/search": minor
---

Search ranking rules, query log and suggestions (data-layer gaps se11 to se13). `SearchSettings` gains `rankingRules`
(pin, hide, boost and recency lines per index and phrase) and `querySample`. The `SearchDriver` port gains `appliesRules`,
the request `pinned`, `hidden`, `boosts` and `recency`, and a `neighbours` lookup (did-you-mean); the memory and
Postgres drivers apply them. A new `SearchQueryLog` port (memory driver in `.`, the abstract
`PostgresSearchQueryLogDriver` in `./node` over the new `search.queries` table, whose queued `record` and its
`data_maintenance.query.record` job are `@stackra/data-maintenance`'s) logs sampled reads and
clicks with personal phrases withheld, and reports top, zero-result and click-through phrases. `SearchIndex` adds
`clicked(phrase, id)` and `suggest(prefix)` (completions from the log, a did-you-mean when the prefix finds nothing),
and `Search` takes the log as an optional fourth constructor argument.

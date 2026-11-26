---
"@stackra/database": minor
"@stackra/runway": minor
---

A call no longer stalls when every pool connection is taken by calls that each need a second one (STA-1716). A call
holds its isolation transaction (ADR 0495) while a `requiresNew` store opens another connection, so with as many
concurrent calls as the pool had connections every call waited for a second that never came, and the `pg` pool waits
without a limit. `PostgresDatabaseDriver` now admits every transaction that takes a connection of its own through a
connection gate by its depth: `max - (nesting - 1)` units run at the top level and one place per deeper level stays free,
so a chain no deeper than `pool.nesting` (default 4) always finishes. A chain deeper than the pool is refused at once
with a `RangeError`, and a transaction that waits past `pool.acquireTimeout` (default 30 seconds) is refused with the
new retryable `ConnectionPoolExhaustedError` (`connection_pool_exhausted`, 503). `DatabaseConfig.pool` takes the two
new optional fields. `poolMaxOf` in `@stackra/runway` now refuses a `poolBudget` that gives an instance fewer than two
connections. See the ADR 0473 note of 2026-11-26.

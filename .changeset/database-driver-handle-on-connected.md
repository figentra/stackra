---
"@stackra/database": patch
---

The `Database` the container hands out is now usable. The container builds the port's `PostgresDatabaseDriver` with no
ORM (the wiring gives it no dependencies), so every class that injected `Database` in a running service, the package's own
`DatabaseHealthIndicatorDriver` and `PostgresIdempotencyStoreDriver` included, failed on first use with a `TypeError`: the
instance the generated boot connected was reachable only as `Database.current()`. An instance built with no ORM is now a
handle on the connected driver: `orm`, `em`, the detached-call store and `close` are the connected driver's, and until one is
connected each fails with "No database is connected". An instance made by `PostgresDatabaseDriver.connect` is unchanged.

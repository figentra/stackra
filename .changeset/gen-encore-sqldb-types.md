---
"@stackra/gen": patch
---

A service with a database gets `.stackra/gen/encore-sqldb.d.ts`, the `encore.dev/storage/sqldb` types its boot's
import of the generated Encore database file needs, so the service typechecks without `encore.dev` installed (TS2307,
STA-1795). The Encore app under `.stackra/encore` keeps the real types.

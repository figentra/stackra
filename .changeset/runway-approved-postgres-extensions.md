---
"@stackra/runway": minor
"@stackra/infra-aws-runtime": minor
"@stackra/database": patch
---

A service runway's `environments.<env>.database.extensions` now takes only the Postgres extensions ADR 0160 approves:
vector, pg_trgm, ltree, citext, pgcrypto, postgis, pg_stat_statements and btree_gist. `@stackra/runway` exports them
as the `PostgresExtension` enum and the frozen `APPROVED_POSTGRES_EXTENSIONS` list, and the shipped
`schema/service.json` carries them as an `enum` on `extensions.items`. Any other name is refused with its path.

The AWS runtime plan carries each Postgres server's extensions (`DatabasePlan.extensions`, the names its member
consumers list, once and sorted) and those it preloads (`preloadLibraries`). A server that preloads one gets its own
parameter group (a cluster parameter group on Aurora) setting `shared_preload_libraries`, applied at the next reboot.

`@stackra/database`'s `Extension` adds `BtreeGist`, so a migration may run `schema.createExtension(Extension.BtreeGist)`.

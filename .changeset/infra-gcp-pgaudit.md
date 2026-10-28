---
"@stackra/infra-gcp": minor
---

Switch pgaudit on for every Cloud SQL server unless the runway says `shared.database.pgaudit: false` (ADR 0212
decision 5): the `cloudsql.enable_pgaudit` and `pgaudit.log` flags (`ddl,role` by default) and a sink routing the
server's pgaudit entries into a log bucket in its region, kept 400 days by default. `GcpRuntimeConfig.database` gains
`pgaudit`.

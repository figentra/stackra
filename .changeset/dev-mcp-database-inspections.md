---
"@stackra/database": minor
"@stackra/cli": minor
"@stackra/mcp": minor
---

A coding agent can now look at the local database the way the app reads it (STA-2906). Three read-only inspections in
`@stackra/database/node` (`describeSchema`, `queryInScope`, `migrationStatus`) back the new `stackra db:schema`,
`stackra db:query <scope> <sql>` and `stackra db:migrations:status` commands, which `stackra mcp` serves as the
`db_schema`, `db_query` and `db_migrations_status` tools. `db_query` runs one SELECT in a READ ONLY transaction as the
app's role, with `app.tenant_id` set to the tenant's scope id given for that transaction only, a row limit (100, at most 1000) and a
statement timeout, so a table under row-level security answers that tenant's rows instead of none. It refuses a role
that can bypass row-level security (pass the service's runtime role with `--role` on a superuser connection), a query
that calls `set_config`, and a second statement (the query runs on the extended protocol). Every inspection reads local
dev and the testbed only: `STACKRA_ENVIRONMENT` must be `dev` or `test`, and in dev the connection must reach this
machine; with no `DATABASE_URL` set, the CLI asks `encore db conn-uri` for the member's local database.
`db:migrations:status` takes no lock and creates no table, and flags a migration edited after it ran. A `.mcp.yaml` now
fails on a separate local Encore server (`separate_encore_server`, ADR 0334 rule 8): `stackra mcp` is the one Encore
path. Remove an `encore` entry that runs `encore mcp`; the remote `encore-cloud` entry stays. The proxied
`encore_query_database` now says in its description that it runs with no tenant set, so a table under row-level
security answers no rows there, and points to `db_query`.

# @stackra/database

## 0.33.0

### Minor Changes

- 246594d: Core re-paths a moved scope subtree's rows for every service. A model opts in with the new `MovesWithScope` trait (@stackra/model); `repathAllRecords(from, to)` (@stackra/database) runs `CrudService.repath` on every registered model with the trait, in the caller's transaction; and `RepathOnScopeMovedListener` (@stackra/scope/node), a queued listener with back-off, runs it on every `scope.node.moved.v1`, so a service writes no re-path listener of its own. A model without the trait is never touched; a `jsonb` scope keeps its owner's own listener.

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [82c2718]
- Updated dependencies [93d63bb]
- Updated dependencies [ad4e5bf]
- Updated dependencies [41a5ff0]
- Updated dependencies [246594d]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/actions@0.33.0
  - @stackra/config@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/testing@0.33.0
  - @stackra/model@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/cache@0.33.0
  - @stackra/console@0.33.0
  - @stackra/container@0.33.0
  - @stackra/events@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
  - @stackra/config@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/cache@0.32.0
  - @stackra/model@0.32.0
  - @stackra/console@0.32.0
  - @stackra/testing@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/events@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Minor Changes

- 6473cf1: A detached call (`ctx.detach()`) now works with the database. `detached.run` enters every wrapper registered in the new `DETACHED_RUNS` (`@stackra/actions/contracts`), and the database registers one when a driver connects: the loop's work runs on a fresh fork, outside the call's committed transaction (which MikroORM otherwise keeps in the context of a continuation started inside it), and `Database.detached()` answers the call's step, per database instance. Inside a detached call, every `CrudService` operation that runs outside a transaction runs as its own step: a short transaction with the call's isolation (`each`, `chunk` and `metrics` excepted). Outside a detached call nothing changes.

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
  - @stackra/actions@0.31.0
  - @stackra/model@0.31.0
  - @stackra/console@0.31.0
  - @stackra/testing@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/events@0.31.0
  - @stackra/validation@0.31.0
  - @stackra/cache@0.31.0

## 0.30.0

### Minor Changes

- 0394e56: The Postgres idempotency store keeps a refusal: migration `0008_add_idempotency_refusal` adds a nullable `refusal` jsonb column to `database.idempotency_keys`, and `completeRefused` upserts it outside the refused call's rolled-back transaction.
- d8d78f0: `DatabaseConfig.health.rowSecurity` (off by default): `/readyz`'s `database` probe also reads the connected role and is
  `down`, whatever `critical` says, when that role can bypass row-level security. That covers a superuser, BYPASSRLS
  (its own or through a role it belongs to), the owner of a table with row security (which could turn FORCE off), a
  member of `stackra_system_access`, or a role with CREATEROLE or CREATEDB: the runtime role of the runtime-role design
  holds none of these.
  Runway turns it on for deployed environments, so a deploy whose runtime role could bypass `FORCE ROW LEVEL SECURITY`
  never goes ready (tenancy audit gap J).
  
  Turn it on only once the service connects as its own runtime role: today a service on Encore connects as the role that
  runs its migrations and owns its tables, so the probe is rightly `down` there until that role exists.
  
  A host that overrides `health` whole (`override health = { timeout, critical }`) now also states `rowSecurity`.
- 15dba8d: The tenancy contract step's two checks are now errors (ADR 0239):
  
  - `assertRowSecurity`: a table without the owner column that no platform list names is a gap, by default. It no longer
    reads `STACKRA_GEN_STRICT`; only the audit's own tests pass `strict: false` to read such tables back as warnings with
    their group. A service's generated isolation test therefore fails on one.
  - gen's `model_tenancy_missing` (and `model_tenancy_migration_missing`) are errors for a package's models, as they
    already were for a service running `@stackra/tenancy`.
  
  Before taking this version, a product must have zero such tables and models: list a table that holds no tenant data
  with `t.platformTable(reason)` (or `t.reviewedPolicy(reason, policies)`), give a tenant table its owner column, and
  mark each model `BelongsToTenant`, `BelongsToTenantOrPlatform` or `Model.global`. Core itself has none.

### Patch Changes

- 7b5a381: `t.change().type()` writes `-- squawk-ignore changing-column-type`, with its reason, when the change only widens a `varchar` or turns one into `text` with no custom conversion: Postgres changes only the catalog. Narrowing and every other type change stay flagged.
- a3a3190: A service runway's `environments.<env>.database.extensions` now takes only the Postgres extensions ADR 0160 approves:
  vector, pg_trgm, ltree, citext, pgcrypto, postgis, pg_stat_statements and btree_gist. `@stackra/runway` exports them
  as the `PostgresExtension` enum and the frozen `APPROVED_POSTGRES_EXTENSIONS` list, and the shipped
  `schema/service.json` carries them as an `enum` on `extensions.items`. Any other name is refused with its path.
  
  The AWS runtime plan carries each Postgres server's extensions (`DatabasePlan.extensions`, the names its member
  consumers list, once and sorted) and those it preloads (`preloadLibraries`). A server that preloads one gets its own
  parameter group (a cluster parameter group on Aurora) setting `shared_preload_libraries`, applied at the next reboot.
  
  `@stackra/database`'s `Extension` adds `BtreeGist`, so a migration may run `schema.createExtension(Extension.BtreeGist)`.
- Updated dependencies [418e195]
- Updated dependencies [6005425]
- Updated dependencies [0394e56]
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
  - @stackra/actions@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/container@0.30.0
  - @stackra/model@0.30.0
  - @stackra/console@0.30.0
  - @stackra/config@0.30.0
  - @stackra/events@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/cache@0.30.0
  - @stackra/testing@0.30.0

## 0.29.0

### Minor Changes

- 11a19a7: An implicit many-to-many pivot of tenant-owned models now stores the call's tenant. MikroORM's pivot insert names only
  the two link columns, so `t.belongsToTenant({ pivot: true })` gives a new pivot's `tenant_id` a default read from
  `app.tenant_id`, and `t.change(column).defaultSetting(setting)` gives an existing pivot the same default. Outside a
  tenant call the default is NULL, so the NOT NULL column refuses the row instead of storing it without a tenant.

### Patch Changes

- 09b2c41: `CrudService` no longer declares a private `settled` member (0.26.0), which broke any subclass with a member of that name (TS2415 and a runtime override). The read flush is a module function now.
- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [45afd22]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/model@0.29.0
  - @stackra/console@0.29.0
  - @stackra/config@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/events@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/cache@0.29.0
  - @stackra/testing@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/model@0.28.0
  - @stackra/console@0.28.0
  - @stackra/testing@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/events@0.28.0
  - @stackra/validation@0.28.0
  - @stackra/cache@0.28.0

## 0.27.0

### Patch Changes

- 4a4d817: A `CrudService` read treats an entity manager without `isInTransaction` (a unit test's partial one) as outside a transaction, instead of throwing.
- @stackra/actions@0.27.0
  - @stackra/model@0.27.0
  - @stackra/console@0.27.0
  - @stackra/testing@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/events@0.27.0
  - @stackra/validation@0.27.0
  - @stackra/cache@0.27.0

## 0.26.0

### Patch Changes

- 93e358e: Inside a transaction, `CrudService` read verbs flush the unit of work first, so a read sees a field set earlier in the same transaction through `update` or a plain set on a loaded row (MikroORM's auto flush misses both).
- a9f21b6: A platform-form table that declares `t.systemAccess` update columns now lets the system-access role through its
  restrictive `pol_<table>_<column>_write_update`. Before this, a claim function run with no tenant (a relay, queue,
  scheduler or workflow lease) reached only the platform's NULL rows and silently skipped every tenant row, because a
  restrictive policy binds every role. The policy compiles as `(<own rows>) or current_user = 'stackra_system_access'`;
  the role's column grants still keep it to the lease columns, and `_write_delete` is unchanged (the role has no
  DELETE). `assertRowSecurity` accepts that suffix only on a table with `pol_<table>_system_access_update`, requires it
  there, and otherwise holds `_write_update` to exactly what `_write_delete` tests. Declare the platform form and
  `t.systemAccess` in the same blueprint.
- Updated dependencies [9cee75d]
  - @stackra/actions@0.26.0
  - @stackra/model@0.26.0
  - @stackra/console@0.26.0
  - @stackra/testing@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/events@0.26.0
  - @stackra/validation@0.26.0
  - @stackra/cache@0.26.0

## 0.25.0

### Minor Changes

- 8f8ddcf: System workers and pre-tenant routes can now find tenant rows before they know the tenant, through one narrow,
  audited way in (ADR 0239 amendment, gap A).
  
  A migration gives a tenant table `t.systemAccess({ select, update, reason })`. This lets the new
  `stackra_system_access` role read the `select` columns and write the `update` columns, and nothing else. The role
  cannot log in, does not bypass row-level security, and no one is a member of it, so no session can become it. The
  package then writes its lookup or claim with `schema.systemFunction({ name, args, returns, sql, reason })`. The
  function runs as that role with a fixed search path, returns only the columns it declares (ids and the tenant id),
  and only the service may call it. The worker then loads each row in that row's tenant.
  
  `assertRowSecurity`, and so every service's generated isolation test, refuses anything looser: a policy for anyone
  but the role, a member of the role, a role that bypasses row-level security, a grant beyond the declared columns, or
  a function that is not `SECURITY DEFINER`, does not pin its search path, or that anyone may call.
  `stackra row-security-declarations` lists both declarations with their reasons for review.
  
  Deployment: the database user that runs migrations needs `CREATEROLE` the first time a migration uses either
  declaration. A managed Postgres master user (RDS) has it; RUNWAY's deploy role must have it too.

### Patch Changes

- 1d7bbc1: The contract migrations (database 0007, achievements 0004, rules 0005, segments 0003, content 0006, collaboration
  0004, workflow 0011 and webhooks 0003) now carry a reviewed squawk ignore, with its reason, above each `SET NOT NULL`
  that the migration's pre-flight checked, so a product that hosts them lints clean. The runner hashes a migration
  without its lint lines, so no checksum changes, and nothing runs differently.
  
  New contract steps can set NOT NULL without scanning the table under an exclusive lock:
  `t.belongsToTenant({ contract: true, safeNotNull: true })`, or `t.change(column).notNull({ safe: true })`, adds a
  `NOT VALID` check, then validates it, sets NOT NULL and drops the check in a later step. The released migrations keep
  their form.
- dc9da69: A blueprint that declares an index on a link column alone (`t.unique(["scope_id"])` beside `t.scopeId()`) no longer also
  writes the column's own plain index. Both took the name `idx_<table>_<column>`, so the migration failed with "relation
  already exists"; the declared index serves the column.
- 3942ab1: Webhook endpoints and their delivery log now belong to a tenant (ADR 0239 amendment, group (c)).
  
  Migration `webhooks.0003` gives `webhook_endpoints` and `webhook_deliveries` a `tenant_id` column. It is required,
  filled from the running tenant call by default, and indexed. Each table gets one row-level-security policy: a call sees
  and writes only its own tenant's rows. Before, neither table had a policy; the endpoint service filtered by scope.
  
  Existing rows get their tenant in the same migration. An endpoint registered at a top-level tenant node takes that
  node, and each delivery takes its endpoint's tenant. If any row is left without a tenant (an endpoint at the root, at a
  product, or below a tenant), the migration refuses before changing anything and names each table's count. Delete or
  re-register those endpoints, then migrate again.
  
  `WebhookEndpoint` and `WebhookDelivery` carry `BelongsToTenant`. Every read and write of these tables must now run in a
  tenant call; the pipeline, the delivery job and the inbox already do. The package ships an int test tier (`test:int`).
  
  `CrudService` writes that use `requiresNew` (`insert`, `insertMany`, `upsert`, `update`) now carry the caller's scope
  and tenant into their own transaction, as `Database.transaction` with `requiresNew` already did. Before, such a write
  ran on a new connection with no tenant, so row security refused it on a tenant-owned table.
- @stackra/actions@0.25.0
  - @stackra/model@0.25.0
  - @stackra/console@0.25.0
  - @stackra/testing@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/events@0.25.0
  - @stackra/validation@0.25.0
  - @stackra/cache@0.25.0

## 0.24.0

### Minor Changes

- 2df7162: The row-security audit learns the group (c) decisions (ADR 0239 amendment).
  
  `assertRowSecurity` now accepts a table that keeps its tenant in `scope_id`, when its one permissive policy is exactly
  the `equals` or `equalsOrUnset` policy `t.rowLevelSecurity` writes on the tenant setting. It then checks that table
  like any owned one, with the two-tenant probe on `scope_id`. A looser policy, such as one that adds `or true`, or a
  second permissive policy, is still refused. Core payments' three tables pass this way, with no migration.
  
  Migrations gain two declarations, each with a required one-line reason:
  
  - `t.platformTable(reason)`: no row of this table can ever belong to a tenant. Compiling refuses it on a table that
    also writes a scope id, an isolation scope id, a column filled from a setting, or a policy. The audit refuses it once
    the table holds the tenant column, a scope id or an isolation scope id.
  - `t.reviewedPolicy(reason, policies)`: the table's policies have a reviewed shape the audit cannot derive. The audit
    still requires row-level security enabled and forced, and every named policy present. Only the tenant-policy checks
    and the probe are left out.
  
  The compiled migration carries each declaration as a comment line. Gen's generated isolation test now passes its
  migrations folder to the audit (`migrationsDirectory`), which reads them.
  
  `PLATFORM_TABLES` gains the platform-list tables: `outbox.inbox`, `outbox.change_cursors`, `queue.job_batches`,
  `scheduler.watermarks`, `workflow.service_ack_sets`, `rules.condition_fields`, `database.seed_records` and
  `scope.scope_nodes`, each with its reason.
  
  New command `stackra row-security-declarations` lists every declaration with its reason. It and
  `stackra validate --repository` fail on a declaration that is not in the reviewed list
  `tools/scripts/row-security-declarations.yaml` with that reason.

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [f86dec4]
  - @stackra/actions@0.24.0
  - @stackra/model@0.24.0
  - @stackra/console@0.24.0
  - @stackra/testing@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/events@0.24.0
  - @stackra/validation@0.24.0
  - @stackra/cache@0.24.0

## 0.23.0

### Minor Changes

- 12f4836: The contract step of the sequence and projection tables. Migration `database.0007_contract_isolation_scope` makes
  `isolation_scope_id` NOT NULL on `sequence_counters`, `sequence_blocks`, `sequence_voids` and `projection_rows`, makes
  `pol_<table>_isolation_scope_id` (equality with `app.tenant_id`) each table's one permissive policy, and keeps the scope
  path only as a restrictive policy. `scope_id` stays the caller's sub-scope. The migration first counts the rows with no
  `isolation_scope_id` and refuses before changing anything if there are any, naming each table's count: an environment
  with such rows from the expand step runs the backfill (RUNWAY 4c) first. After this step a sequence or projection is
  written only inside a tenant call.
  
  New migration API for a contract step: `schema.refuseNulls(column, tables, remedy)` (the pre-flight),
  `t.dropRowLevelSecurity(column, options)` (drops a policy an earlier migration created, by the name it was created
  under), `restrictive: true` on `t.rowLevelSecurity` (an `AS RESTRICTIVE` policy that does not narrow a session with the
  setting unset), and a policy on a column an earlier migration wrote. `assertRowSecurity` audits these four tables by
  `isolation_scope_id` (group (b), by name), with every check and probe of a tenant table.
  
  The platform form of a nullable id column is the `platform` match of `t.rowLevelSecurity`. A tenant reads its own rows
  and the NULL rows and writes only its own. A session without a tenant reads and writes only the NULL rows. It comes
  with the restrictive `pol_<table>_<column>_write_update` and `_write_delete`. `exemptNull` lets a column's NULL rows
  through a restrictive path narrowing when their path is at or above a granted path. `schema.refuseNulls(..., { where })`
  counts only the rows that also meet `where`. `assertRowSecurity` accepts and requires the two write policies on a
  platform-form table, does not count its NULL rows against a probe, and checks that a tenant can neither take over nor
  delete a platform row. It no longer stages a table in the expand step as a warning: every package table now has its
  contract step, so such a table takes the hard checks.
- a2c8821: A seeder that injects its repositories or services now runs wherever seeders run. A seeder is not a binding, so the
  container could not build one with its dependencies: `.seed()` and `stackra db seed` built it with no arguments and its
  first repository call failed. `seederOf(container, type, deps)` (`@stackra/database/node`) builds a bound seeder from the
  container, else the class with its constructor tokens resolved in the container. Gen lists those tokens in the seed
  entry (`SeederEntry.deps`) and registers them in the test setup (`registerSeederDeps`, `@stackra/database/testing`).

### Patch Changes

- 82238da: Under the memory (PGlite) driver, `Database.transaction(work, { requiresNew: true })` inside a running transaction runs
  as a savepoint instead of waiting forever for a second connection PGlite does not have. It commits with the caller
  under PGlite, and a failure inside it rolls back only the savepoint; its timeouts still apply. The independent commit
  is proven only in `.int` tests on Postgres. The Postgres driver's real `REQUIRES_NEW` is unchanged.
- 6edeee4: Peers no longer fork a product's install. pnpm gives a package one variant per set of resolved peers, so an optional
  peer one member installs and another does not split every dependent in two: a product with connectors (react-dom for
  their tests) and a pglite service resolved two copies of @stackra/integrations, whose classes then failed each other's
  checks. `@stackra/database`'s test-only packages (PGlite and its extensions, Faker, Testcontainers) are no longer peers:
  its testing entry loads them from the member running the tests, as their devDependencies. `react-dom` is a required peer
  of `@stackra/ui`, `@stackra/app` and `@stackra/notifications`. `stackra validate` refuses a test-only package as a
  library's peer and an optional `react-dom` (`forking-peers`).
- Updated dependencies [a42a80c]
  - @stackra/actions@0.23.0
  - @stackra/model@0.23.0
  - @stackra/console@0.23.0
  - @stackra/testing@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/events@0.23.0
  - @stackra/validation@0.23.0
  - @stackra/cache@0.23.0

## 0.22.0

### Patch Changes

- b394912: `CrudService.lock` flushes the unit of work before its refreshing read. Locking one row twice in a transaction used to
  drop a value assigned (and not yet flushed) since the first lock, so every invoicing document was numbered 1. An added
  column whose default is a setting (`defaultSetting`) now carries `-- squawk-ignore adding-field-with-default` and its
  reason in the compiled SQL (`current_setting()` is STABLE, so there is no table rewrite), which clears every host's squawk
  on `database.0006_add_isolation_scope`. Lint comment lines are left out of a migration file's checksum, so adding
  one keeps a frozen file valid; a row recorded under the old whole-file checksum (a file that already had a lint line) is
  still accepted.
- Updated dependencies [786848c]
- Updated dependencies [acbee14]
  - @stackra/actions@0.22.0
  - @stackra/events@0.22.0
  - @stackra/model@0.22.0
  - @stackra/console@0.22.0
  - @stackra/testing@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/validation@0.22.0
  - @stackra/cache@0.22.0

## 0.21.0

### Minor Changes

- a785356: The geospatial field kit on PostGIS (ADR 0314, STA-1432):
  
  - `@stackra/contracts`: the `GeoPolygon` and `GeoLine` types beside `GeoPoint`.
  - `@stackra/validation`: the `geoPoint()`, `geoPolygon()` and `geoLine()` schemas.
  - `@stackra/model`: the `GeoPointType`, `GeoPolygonType` and `GeoLineType` column types (EWKT in, `ST_AsGeoJSON` out).
  - `@stackra/database`: `t.point()`, `t.polygon()` and `t.line()` with default GiST indexes, the `areaCovers`,
    `withinMetresOf` and `intersectsArea` conditions, the `HasLocation` trait, and PostGIS in the PGlite memory driver
    and `db diff` when a member installs `@electric-sql/pglite-postgis`.
  - `@stackra/gen`: the `geo` kind, mapped to `geography(<shape>,4326)` columns, entity column types and the schemas.

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/model@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/console@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/events@0.21.0
  - @stackra/cache@0.21.0
  - @stackra/testing@0.21.0

## 0.20.0

### Patch Changes

- 80d121b: `usePostgres()` uses the integration-tier image as it is when Docker already has it under its tag (built before, or
  preloaded), and otherwise builds it with the process's `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` passed as build
  arguments, so its `apt-get` reaches the mirrors on a machine whose only way out is a proxy (a testbed job, STA-2572).
- 19a9222: A `requiresNew` transaction now runs in the caller's scope and tenant. It opens on another connection, which had none
  of the caller's transaction-local `app.*` settings, so under forced row-level security its insert was refused or its
  `tenant_id` default wrote NULL. `runTransaction` now reads those settings from the running transaction before it opens
  the new one and sets them first inside it, as `onReplica` already did for a replica (both share one helper now). This
  also fixes `CrudService` `insert` and `update` with `requiresNew` and the webhook delivery attempts written that way
  under row-level security. With no transaction running, nothing changes (STA-2565).
- Updated dependencies [667a3b5]
- Updated dependencies [a7b7e58]
- Updated dependencies [667a3b5]
  - @stackra/actions@0.20.0
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/model@0.20.0
  - @stackra/console@0.20.0
  - @stackra/config@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/events@0.20.0
  - @stackra/cache@0.20.0
  - @stackra/testing@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- b59aa22: The `postgres` cache driver's tables now ship as a migration: `database.0005_create_cache_tables` makes
  `cache.entries` and `cache.set_members` (unlogged, "C"-collated keys, sweep indexes) with `if not exists`, so it adopts
  tables a service made earlier from `postgresCacheTables("cache")` and keeps their rows. They are platform tables, with
  no `tenant_id` and no row-level security: each key already carries its `CacheNamespace` prefix and the driver runs
  outside the caller's transaction. The driver never creates a table; a missing one rejects the call.
- 12f25aa: Migration `database.0006_add_isolation_scope` adds `isolation_scope_id` to `sequence_counters`, `sequence_blocks`,
  `sequence_voids` and `projection_rows`: a nullable, indexed public-id column that every insert fills from
  `app.tenant_id` (`defaultSetting`), and no policy change. `scope_id` stays the key it was, since a sequence or a
  projection row may sit at a node below the isolation's. This is the expand step; a backfill and the contract step
  (NOT NULL, equality with the setting as the one permissive policy) follow (tenancy audit 2026-11-07, gap D).
- e5f5432: An `equals` or `equalsOrUnset` row-level-security policy on a `uuid` column now decodes a public-id setting
  (`scp_…`, as `withTenant` writes it) to the UUID it encodes, so a tenant table compiled with `publicIds: "uuid"` no
  longer raises on every query; a raw UUID setting is still cast as it is, and text columns are unchanged.
- 40fda23: `Database.withScope` puts the enclosing scope settings back when it runs inside a running transaction. A released
  savepoint keeps a `set_config(…, true)` until the outer transaction ends, so a nested call used to leave
  `app.scope_id`, `app.scope_path` and `app.scope_paths` on the inner scope for the rest of the caller's transaction. The
  nested call's writes are flushed before the settings go back, so they still land in its own scope.
- dd9427a: `assertRowSecurity` now audits every table, not only those holding the owner column: a table without it fails unless
  `PLATFORM_TABLES` (the migration ledger, the action store, cache and lock tables) or the new `platform` option names it
  with a reason. An owned table must have exactly one permissive policy, `pol_<table>_<column>`, the `FOR ALL` owner
  equality, and only restrictive policies named after their column beside it (ADR 0347 decision 5). The probe seeds a
  row of each owner itself, so the cross-owner read always runs, and also checks that an unset setting sees no row and
  the owner sees its own. gen's generated tenant-isolation test passes the service's `Model.global` tables and
  `MODEL_SCOPE_EXEMPTIONS` as `platform`. A table under a scope-path policy with no `tenant_id` now fails the audit.
- 4a23af8: `assertRowSecurity` now treats a table in the expand step of the scope-path migration as a warning until 0.20, not a failure. That is a table with a nullable owner column, no `pol_<table>_<column>` policy yet, and its permissive `scope_path` policy still in place. The warning reads "(a) ancestor scope_path table in the expand step, awaiting backfill and the contract step". It is a failure under `strict: true` or `STACKRA_GEN_STRICT=1`. A NOT NULL owner column, or a table without that `scope_path` policy, still gets every hard check.
- fc845f4: `assertRowSecurity` stages its every-table check like gen's tenancy checks. Until 0.20, an unlisted table without the owner column is a warning, not a failure. `assertRowSecurity` now returns these warnings. Each one names the table's group, read from the catalogue:
  
  - an ancestor `scope_path` table awaiting the contract step;
  - a `scope_id` table whose policy reads the owner setting;
  - a system table with no row-level security, awaiting its ADR decision;
  - otherwise, unclassified.
  
  With `strict: true` or `STACKRA_GEN_STRICT=1`, these tables fail the audit as they will from 0.20. Every other finding still fails at once: the policy shape of an owned table, the probe's checks, a listed table that holds the column, and a listing with no reason.
  
  gen's tenant-isolation test now prints each warning and passes when the audit returns only warnings.
- d2b3d22: A column can default to a transaction setting: `.defaultSetting("app.x")` writes
  `default nullif(current_setting('app.x', true), '')`, so a writer that names no value stores the call's setting and
  rows that predate the column stay null (refused on a `uuid` column for now). `t.belongsToTenant({ expand: true })` uses
  it for the expand step of an existing table: a nullable, indexed `tenant_id` filled from `app.tenant_id`, and no
  policy, so the table keeps the one it has until the contract step makes the tenant equality its one permissive policy
  (ADR 0347 decision 1; tenancy audit 2026-11-07, gap D).
- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [b59aa22]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
- Updated dependencies [0da5f7a]
- Updated dependencies [0921f1f]
- Updated dependencies [0e0de4f]
- Updated dependencies [0e0de4f]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/cache@0.19.0
  - @stackra/config@0.19.0
  - @stackra/model@0.19.0
  - @stackra/console@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/events@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/testing@0.19.0

## 0.18.1

### Patch Changes

- @stackra/actions@0.18.1
  - @stackra/model@0.18.1
  - @stackra/console@0.18.1
  - @stackra/testing@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/events@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/cache@0.18.1

## 0.18.0

### Patch Changes

- @stackra/actions@0.18.0
  - @stackra/model@0.18.0
  - @stackra/console@0.18.0
  - @stackra/testing@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/events@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/cache@0.18.0

## 0.17.2

### Patch Changes

- @stackra/actions@0.17.2
  - @stackra/model@0.17.2
  - @stackra/console@0.17.2
  - @stackra/testing@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/events@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/cache@0.17.2

## 0.17.1

### Patch Changes

- @stackra/actions@0.17.1
  - @stackra/model@0.17.1
  - @stackra/console@0.17.1
  - @stackra/testing@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/events@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/cache@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/model@0.17.0
  - @stackra/console@0.17.0
  - @stackra/testing@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/events@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/cache@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/model@0.16.0
  - @stackra/console@0.16.0
  - @stackra/config@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/events@0.16.0
  - @stackra/cache@0.16.0
  - @stackra/testing@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/actions@0.15.0
  - @stackra/model@0.15.0
  - @stackra/console@0.15.0
  - @stackra/testing@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/events@0.15.0
  - @stackra/validation@0.15.0
  - @stackra/cache@0.15.0

## 0.14.4

### Patch Changes

- @stackra/actions@0.14.4
  - @stackra/model@0.14.4
  - @stackra/console@0.14.4
  - @stackra/testing@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/events@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/cache@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/model@0.14.3
  - @stackra/console@0.14.3
  - @stackra/testing@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/events@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/cache@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/model@0.14.2
  - @stackra/console@0.14.2
  - @stackra/config@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/events@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/cache@0.14.2
  - @stackra/testing@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/model@0.14.1
  - @stackra/console@0.14.1
  - @stackra/testing@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/events@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/cache@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/model@0.14.0
  - @stackra/console@0.14.0
  - @stackra/testing@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/events@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/cache@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/model@0.13.0
  - @stackra/console@0.13.0
  - @stackra/testing@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/events@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/cache@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/model@0.12.0
  - @stackra/console@0.12.0
  - @stackra/testing@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/events@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/cache@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/model@0.11.1
  - @stackra/console@0.11.1
  - @stackra/testing@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/events@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/cache@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/model@0.11.0
  - @stackra/console@0.11.0
  - @stackra/testing@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/events@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/cache@0.11.0

## 0.10.0

### Patch Changes

- aea9b1d: `registerEntities` keeps one schema per schema-qualified table. A service that hosts a package's models (gen's
  `#stackra/entities/hosted/…`) and also loads that package's own entity list (`registerEntities(TENANCY_ENTITIES)` in
  its `node` entry) registered the table twice, and MikroORM refused to start ("Duplicate table names are not allowed").
  Every test of pay's two services failed on `tenancy.approval_bindings`, and a server would not boot (STA-2116).
- Updated dependencies [e57b9a1]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/cache@0.10.0
  - @stackra/model@0.10.0
  - @stackra/console@0.10.0
  - @stackra/container@0.10.0
  - @stackra/events@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/testing@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [be4a198]
- Updated dependencies [9bb5d55]
- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [b174a17]
- Updated dependencies [f9c825d]
  - @stackra/console@0.9.0
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/model@0.9.0
  - @stackra/container@0.9.0
  - @stackra/cache@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/config@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/events@0.9.0
  - @stackra/testing@0.9.0

## 0.8.0

### Minor Changes

- 928dcc0: A service's generated `boot` now calls `connectVisibilityFilter(container)` beside the hold registry and sequence time
  zone, so reads AND the bound `VisibilityFilter`'s conditions, `UserStamps` take the running call's actor, and
  `callTimeZone()` reads the call's time zone; until now nothing outside tests connected it, so record visibility, user
  stamps and the call time zone were all off (STA-2044). The database testing plugin connects the compiled app the same
  way on every compile, and the memory database runs the `StampSubscriber`, so unit tests see what production does.

### Patch Changes

- Updated dependencies [7dd35b3]
  - @stackra/container@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/model@0.8.0
  - @stackra/console@0.8.0
  - @stackra/config@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/events@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/cache@0.8.0
  - @stackra/testing@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/actions@0.7.1
  - @stackra/model@0.7.1
  - @stackra/console@0.7.1
  - @stackra/testing@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/events@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/cache@0.7.1

## 0.7.0

### Patch Changes

- @stackra/actions@0.7.0
  - @stackra/model@0.7.0
  - @stackra/console@0.7.0
  - @stackra/testing@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/events@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/cache@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/model@0.6.1
  - @stackra/console@0.6.1
  - @stackra/testing@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/events@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/cache@0.6.1

## 0.6.0

### Patch Changes

- fb29d41: `@stackra/database/testing`'s `snapshotKey` resolves `@electric-sql/pglite` when it is first called, not when the module
  is imported, so a member without the optional PGlite peer can import `./testing` (STA-1950). A test now refuses any
  peer resolved or required at module level, which the import mocks cannot see.
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [2256bf6]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [4fcb66d]
  - @stackra/console@0.6.0
  - @stackra/cache@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/model@0.6.0
  - @stackra/testing@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/events@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- 4fa949b: `@stackra/database/testing` loads its optional Testcontainers peers (`@testcontainers/postgresql`, `testcontainers`)
  only when `usePostgres()` starts a container, so a member without them can import `./testing` and run its unit tests
  (STA-1950). Before this, every unit test that loaded a factory failed with "Cannot find package
  '@testcontainers/postgresql'".
- @stackra/actions@0.5.1
  - @stackra/model@0.5.1
  - @stackra/console@0.5.1
  - @stackra/testing@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/events@0.5.1
  - @stackra/validation@0.5.1
  - @stackra/cache@0.5.1

## 0.5.0

### Patch Changes

- @stackra/actions@0.5.0
  - @stackra/model@0.5.0
  - @stackra/console@0.5.0
  - @stackra/testing@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/events@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/cache@0.5.0

## 0.4.0

### Minor Changes

- 9c8d108: Packages contribute console commands, and gen collects them per member (STA-1731). `@stackra/console` audits a
  command declared `audit: true` through the `CommandAudit` port (refused before it runs when no sink is ready; secret
  values redacted). gen records commands in the manifest, merges hosted packages' commands, refuses
  `command_collision`, and writes `#stackra/commands` and a console entry that `stackra console <member>` runs. First
  commands: `db:migrate`, `db:rollback`, `db:status`, `db:seed`, `tenant:list`, `tenant:create` (with a
  `TenantDirectory` port), `cache:clear` (the `Cache` port gains `flush`), `queue:work`, `queue:failed` and
  `queue:retry`; `@stackra/access-log` stores command audit entries (`STACKRA_COMMAND_AUDIT_SCOPE`).
- 3df2c07: The console command `db:seed` is now `seed-pack:status` (`SeedPackStatusCommand`): it reports a seed pack's stored
  records, and `stackra db seed` is the one that runs seeders (STA-1852). The `./node` export test lists
  `readMigratedSchema`.
- 1c22c33: `stackra db seed` runs a service's seeders: gen writes `.stackra/entry/seed.ts` (boot, direct database url, no relay loop), `runSeeders` runs `minimal` then the profile, each seeder built by the container in its own transaction with a seed ledger row, skipping a seeder whose source is unchanged (`--again` re-runs). Production refuses `demo`, `test` and `--again` without `--allow-production` and records who ran it. `stackra seed-pack` runs the same step after its records. A service's `boot` takes `url` and `relay` options.

### Patch Changes

- 4f3f1ed: `checkMigrations` loads PGlite and its extensions on first use, like the memory driver, so importing
  `@stackra/database/testing` no longer needs the optional PGlite peers (STA-1853).
- e070131: `MemoryDatabaseDriver` starts each instance from a PGlite snapshot built once per migrations set and kept in a temp file, instead of running initdb, the extensions and the migrations every time (STA-1685). Every instance still gets its own fresh database.
- d675b4d: `@stackra/database/node` exports `readMigratedSchema(files, schemas)`: it replays compiled migration steps on an
  in-memory PGlite with the approved extensions and reads back the tables, columns (type and nullability), indexes and
  foreign keys of the given schemas as plain data (`MigratedSchema`). It is what `stackra db diff` compares the models
  with. It needs the optional peer `@electric-sql/pglite`, and `@electric-sql/pglite-pgvector` for `vector`, and says so
  when they are missing.
- 2d6bb63: The testing module's `.seed(...)` takes each seeder from the container when the wiring binds it, so a seeder that injects a service (a settings pack, a repository) gets it; an unwired seeder is still built without arguments.
- 7dc74f6: The testing tier publishes an event a model records after its last flush, such as the first event recorded on the row
  `insert` returned: at commit it takes what every model the transaction holds recorded, not only the changed ones.
- d9bf3c2: The testing entry loads its optional peers (`@faker-js/faker`, `@electric-sql/pglite`,
  `@electric-sql/pglite-pgvector`, `@mikro-orm/pglite`) on first use, not on import, so a service without them can load
  `@stackra/database/testing`. A test that needs one that is missing gets an error naming all four.
- 90f55b1: A model's recorded events reach the testing app after commit (STA-1740). `MemoryDatabaseDriver` and `usePostgres()`
  connect `RecordedEventsSubscriber`, which takes each flushed model's recorded events and, once the outermost
  transaction commits, hands them to the new `commitEvents` of `@stackra/events/testing`: an integration event to the
  app's outbox, any other on its bus, so `run()` results and `app.events.published()` hold them. A rollback publishes
  nothing, and a released savepoint's events wait for the transaction around it. `@stackra/database` takes
  `@stackra/events` as an optional peer for its testing entry.
- 688cf0c: `drainOutbox()` delivers each event as the production inbox receives it once `@stackra/database`'s testing entry is
  loaded: on its own, in a new transaction, as the actor of the call that wrote it, in that call's scope (through the
  app's `CallIsolation`, or `withScope` without one), so listener tests over tenant-owned rows need no wrapper.
  `commitEvents(events, call)` records the call's actor, id and scope; `deliverEventsIn` registers the delivery scope
  (STA-1789).
- Updated dependencies [71b37fc]
- Updated dependencies [7a94bc4]
- Updated dependencies [a7eaed4]
- Updated dependencies [a8c358a]
- Updated dependencies [0b660e0]
- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [ef987d9]
- Updated dependencies [a8c358a]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [90f55b1]
- Updated dependencies [688cf0c]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [79dc807]
- Updated dependencies [5fc0db7]
- Updated dependencies [2bbc0e8]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/console@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/cache@0.4.0
  - @stackra/container@0.4.0
  - @stackra/events@0.4.0
  - @stackra/model@0.4.0
  - @stackra/config@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/testing@0.4.0

## 0.3.0

### Patch Changes

- c4443b5: Refuse a keyed call that joined a running transaction when the idempotency store cannot join it (STA-1699, ADR 0495
  note of 2026-11-01): `IdempotencyStore.joinsTransaction` (true for the Postgres store), `UnitOfWork.inTransaction()`
  (answered by the database unit of work) and the new `IdempotencyStoreNotTransactionalError`
  (`idempotency_store_not_transactional`), thrown before anything is claimed or run.
- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- be75ede: The Postgres idempotency store joins the running transaction instead of opening its own (STA-1699, ADR 0495 note of
  2026-11-01). A call that joined an outer transaction whose commit then fails no longer leaves a completed key, so its
  retry runs again instead of replaying a success that never committed.
- Updated dependencies [a60f4e9]
- Updated dependencies [c4443b5]
- Updated dependencies [b00096a]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
  - @stackra/actions@0.3.0
  - @stackra/cache@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/model@0.3.0
  - @stackra/testing@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- cfdcdf8: The package's own migrations (`0001`–`0004`) import `Migration`, `Extension` and their types from `@stackra/database`
  instead of the internal `#core/*` aliases. A service that installs `@stackra/database` from the registry compiles them
  from a copy in its own `.stackra/cache`, where `#core` does not resolve, so gen refused them with
  `migration_load_failed`. The compiled SQL is unchanged.
- 1a9259b: The integration tier runs (STA-1570). `@stackra/vitest-config/int` adds `intTier(config)` and `INT_TESTS`
  (`src/**/__tests__/**/*.int.test.{ts,tsx}` and gen's `.stackra/tests/**/*.int.test.ts`); `servicePreset`'s `int`
  project uses the same globs. The members with `.int.test.ts` files gain `vitest.int.config.ts` and a `test:int` script,
  which the new turbo task `test:int` and the Quality Gate run on a Testcontainers Postgres.
- Updated dependencies [2d5a888]
- Updated dependencies [2d5a888]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/model@0.2.0
  - @stackra/testing@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0
  - @stackra/cache@0.2.0

## 0.1.0

### Minor Changes

- 94ae85f: `AppendOnly` is enforced (stackra-256). `CrudService` refuses `update`, `increment`, `delete`, `restore` and `repath`
  on an append-only model with `AppendOnlyWriteError`; `purge` and `forceDelete` still remove rows for retention and
  erasure. `AppendOnlySubscriber` refuses a flush that changes a loaded row, and the generated boot adds it.
  `t.appendOnly()` revokes `UPDATE` on the table from `public` and the migrating role, and gen refuses an own
  `AppendOnly` model whose table no migration revokes it on (`append_only_not_revoked`).
- dddbbcd: `Blueprint.change(column)` changes an existing column in a frozen migration: `nullable()` (drop NOT NULL), `notNull()`
  (set NOT NULL, a contract step) and `type(to, { from, using? })`, each compiled with its inverse from the migration's
  own literals; refused on a table being created, on a column the blueprint adds, twice, or when it changes nothing. New
  type `ColumnChange` (STA-918).
- 856995c: Bulk verbs and an offset paginator on `CrudService` and `Repository` (stackra-280). `insertMany(rows)` and
  `upsert(rows, { by })` write through one flush, so each row is stamped, its encrypted fields sealed and its change
  recorded; `upsert` returns the rows with created and updated counts. `updateWhere(where, data)` is one stamped native
  statement reported to the change feed (raising `version` on a `Versioned` model), and goes through the unit of work
  when it sets an encrypted field. `deleteWhere(where)` follows the delete policy. `each` and `chunk` walk the matching
  rows by keyset in batches, and `page({ page, perPage, sort })` reads a numbered page with its total.
- e7ee0a4: Raise database errors as refusals at the action boundary: `translateDbError` maps an optimistic-lock failure to
  `StaleVersionError` (409), a unique violation to `DuplicateRecordError` (409), foreign-key, check and not-null
  violations to `ConstraintViolatedError` (400) and deadlocks, serialization failures and timeouts to the retryable
  `TransactionConflictError`. `CrudService.update` takes `expectedVersion`, and `CallOptions.expectedVersion` (from
  If-Match) reaches handlers as `ctx.expectedVersion`.
- ca85d59: Add `Extension.Postgis` (`postgis`), approved by ADR 0314, so `schema.createExtension(Extension.Postgis)` compiles, and
  fix the enum header that still said PostGIS needed an ADR.
- d72a734: Add `DatabaseHealthIndicatorDriver` (`./node`, the `HealthIndicator` named `database`, which runs `select 1`) and `DatabaseConfig` (key `database`, with `DatabaseConfig$` and `DatabaseConfigOptions`), whose `health` field sets the probe timeout (`PT2S`) and whether a failure is critical (STA-1379). New dependencies: `@stackra/config`, `@stackra/validation`, `zod`.
- 9841d79: Add the `inherited` row-level-security match (ADR 0412): the `ancestor` policy plus a select-only
  `pol_<table>_<column>_inherited` policy, so rows seeded at the platform or product node are read, never written, by
  every tenant below them.
- f6d1a76: Add the legal-hold seam of ADR 0134 (2026-10-24 amendment): the `HoldRegistry` port and `Disposal` enum in
  `./contracts`, and `connectHoldRegistry`, `disposableIds`, `HoldSubscriber` (refuses a unit-of-work delete of a held
  row) and `RecordHeldError` in `.`; `CrudService.purge` now removes only the rows no hold covers. Add ICU collations:
  `schema.createCollation(name, locale)` and `.collate(name)` on a text column, for Arabic sorting.
  
  Add `visibleKeysQuery(model)`, the parameterised subquery of the keys the caller may see, so a raw-SQL read path such
  as search applies record visibility before it ranks.
- c196bc6: The partition and retention jobs move to the add-on `@stackra/data-maintenance` (ADR 0462 decision 1), which holds their
  system-held permissions. `./node` no longer exports `MaintainPartitionsAction`, `PruneRecordsAction` or their input and
  output schemas; `.` adds `maintainAllPartitions(now)` and `pruneAllRecords(now)`, the work those jobs call.
- 49ab0e6: Harden the migration runner: a session advisory lock so concurrent runners wait, a `schema_migrations_history` ledger
  with each file's checksum and `applied_at` (an edited applied file is refused), a per-file
  `-- stackra:timeout=<interval>` header, and cleanup of the INVALID index a failed concurrent build leaves.
- d156aa8: Add the `./node` entry (`PostgresDatabaseDriver`, `DatabaseUnitOfWorkDriver`) and the `./contracts` entry
  (`VisibilityFilter`, `Where`); both leave `.`. `Database` stays in `.` because it carries `Database.current()`. Gen's
  generated boot imports the Postgres driver from `@stackra/database/node`.
- 6d46e5e: A foreign key or enum check added to an existing table (`schema.table`) now compiles to `ADD CONSTRAINT ... NOT VALID`
  in the migration's transaction plus one `VALIDATE CONSTRAINT` step per constraint after it, so the add takes no scan
  and validation lets writes continue (ADR 0159 d3, stackra-251). Constraints on a created table stay inline. CI lints
  the compiled `.up.sql` files with Squawk.
- 2787c1e: Add `@stackra/database`, the MikroORM layer on Postgres: `CrudService<M>` with resource-table and metrics reads,
  repositories, the graph reader, the `Migration`, `Macro` and `Seeder` kinds with a migration compiler that enforces the
  ADR 0159 and 0160 rules, the `idx_`/`fk_`/`ck_` naming strategy, the unit of work and `ScopeRef` scope sessions, gapless
  document numbers (the `Sequence` kind, `SequenceService` with offline reservation blocks, and the scoped counter, block
  and void tables of ADR 0342), the record-visibility filter seam of ADR 0333 (`VisibilityFilter`,
  `connectVisibilityFilter`), and the `Factory` and `usePostgres` test helpers.
- 38a5501: Add native time partitioning: the `Partitioned({ by, interval, premake, retain })` trait, the blueprint's
  `t.partitionBy(column)` (range partitioning, a default partition, the column in the primary key, a BRIN index),
  `maintainPartitions`, and `maintainAllPartitions`, which creates partitions ahead and drops expired ones unless a
  legal hold covers a row; the daily job that runs it is `@stackra/data-maintenance`'s.
- e0f2fc8: Add the database memory driver to `@stackra/database/testing` (ADR 0266, addendum 2026-10-26). `MemoryDatabaseDriver` runs
  PGlite in process through `@mikro-orm/pglite` and applies the member's compiled migrations, or the entity schema, before the
  first query. The testing plugin connects a fresh one per testing module unless another database is connected, so
  `createTestingModule(X).useDrivers("memory")` needs no Docker. `app.repository(Model)` returns the model's repository
  (`repositoryOf`). New peer dependencies of the testing entry: `@electric-sql/pglite` and `@mikro-orm/pglite`.
- 62c7ae1: Pool budget wiring and a direct URL (ADR 0473, stackra-254). `DatabaseConfig.pool` (`max`, `min`, `idleTimeout`)
  sizes the pool of one instance and `PostgresDatabaseDriver.connect({ pool })` hands it to MikroORM for the primary and
  each replica. The generated boot passes it, with `DATABASE_POOL_MAX` over `max`; runway's `poolMaxOf` gives that share
  of the service's `poolBudget`. The migration and seed runners connect with `directDatabaseUrl()`
  (`DATABASE_DIRECT_URL`, else `DATABASE_URL`), so they never go through a transaction-mode proxy.
- c868bad: Add `Projection<Row>({ key })`, the read-model kind base (ADR 0294 decision 16, ADR 0163 decision 1): a binding whose
  `put` and `remove` keep one version per write in the new `database.projection_rows` table (migration
  `0004_create_projection_rows`, forced ancestor policy), skip a write older than the current version, and whose `get`
  and `list` read now or `asOf` a past moment. Adds the types `ProjectionClass`, `ProjectionOptions`,
  `ProjectionReadOptions` and `ProjectionRow`.
- 0d36f0d: Add the Postgres `IdempotencyStore` and `RateLimitStore` drivers for `@stackra/actions` and their tables, the seed
  runner (`seedState`, `applySeed`) over a new `database.seed_records` ledger, and the `SequenceTimeZone` port with
  `connectSequenceTimeZone`: a yearly series reads its year in its owner's time zone setting. The migration compiler
  now refuses a raw `CREATE SEQUENCE` (ADR 0394, 0396).
- a701ccb: Add runtime database timeouts: `DatabaseConfig.timeouts` (statement, lock, idle in transaction) passed to `connect` as
  `DatabaseOptions.timeouts` and set on every primary and replica session, `TransactionOptions.timeout` as a
  transaction-local statement timeout, and an action's `timeout` option that the pipeline hands to
  `UnitOfWork.transaction(work, { timeout })`.
- a526605: Make the delete policies work: the drivers register the `deleted` and `archived` filters for `SoftDeletes` and the new
  `Archivable` trait, `CrudService` gains `delete` (soft delete, archive or hard delete by the model's traits),
  `restore` and `forceDelete`, its reads take `withDeleted`/`onlyDeleted`/`withArchived`/`onlyArchived`, `purge`
  reaches kept rows, and the blueprint gains `t.archivable()`.
- da8bdbd: Add `StampSubscriber`, which fills `UserStamps` (`createdBy`, `updatedBy`) from the running call's actor and moves
  `Timestamps.updatedAt` on unit-of-work writes; `CrudService.increment` and `repath` stamp their native updates too.
- 763e901: Test with every approved extension (gap db19). `usePostgres()` now runs the Stackra test image by default, built once
  per test process from PostGIS 3.6 on Postgres 18 plus pgvector, so integration tests can create `vector`, `postgis` and
  the other approved extensions; `usePostgres({ image })` still runs any other image. `MemoryDatabaseDriver` loads
  pgvector into PGlite through `@electric-sql/pglite-pgvector`, so unit tests can use vector columns. New optional peers
  of `./testing`: `testcontainers` and `@electric-sql/pglite-pgvector`.
- f11cbe8: Transaction options and lock modes (stackra-279). `TransactionOptions` adds `isolation` (`Isolation.ReadCommitted`,
  `RepeatableRead`, `Serializable`), `readOnly`, `lockTimeout` (`set local lock_timeout`) and `retry`, which runs the
  whole work again (up to 10 times, jittered back-off) after a serialization failure (`40001`) or deadlock (`40P01`).
  `isolation`, `readOnly` and `retry` apply to a transaction the call starts and are refused inside a running one
  without `requiresNew`. Both drivers share `runTransaction`. `Repository.lock(where, options)` takes `shared`
  (`for share`), `nowait` (fail at once) or `skipLocked` (lock the first free match, or `null`).
- f7a2d36: `$raw` takes one fragment or several ANDed, and the new `jsonContains`, `jsonPath`, `ancestorOf` and `descendantOf`
  build parameterised fragments for it. `CrudService.countDistinct` (and `Repository`) shares `sum`'s aggregate path and
  the visibility filter. `DatabaseOptions.replicas` and `Database.onReplica` run a read-only replica transaction that
  replays the running `app.*` settings, so row-level security holds there; `preferReadReplicas` stays off.
- 483eb44: Add the `Cached({ ttl })` model trait and `cacheTtlOf` (@stackra/model; a model with encrypted fields is refused).
  `CrudService.findOne` and `findOneOrFail` by `{ id }` alone, outside a transaction and with no visibility condition,
  read a `Cached` model's row through the shared `Cache` (MikroORM's result cache over `EntityResultCacheAdapter`, set by
  `PostgresDatabaseDriver`), keyed by `CacheKey.of(Model, id, scopeId, scopeNodeId)`. New `CacheInvalidationService`, an
  outbox change consumer that forgets `CacheKey.of(Model, id)` after every committed change. @stackra/database now
  depends on `@stackra/cache` (data-layer gaps ca4, ca5, cdc10; STA-1431).
- 6f2c1f7: Add the `HasMetadata` and `HasOwner` traits (ADR 0321 d4, data-layer gap mo18). `@stackra/database` exports
  `HasMetadata` (a `metadata` bag of string keys to string values, at most 16 KB), the blueprint's `t.metadata()` (with an
  optional GIN index), `MetadataSubscriber` and `MetadataInvalidError`; `CrudService` checks metadata on every write.
  `@stackra/iam/node` exports `HasOwner` (`ownerId`, the owner or assignee) and `OwnerMacro` (`t.owner()`).
- 3d080e7: Add the `HasTree` trait (ADR 0321, data-layer gap mo16): `parentId` and an `ltree` `treePath`, a new system field.
  `@stackra/database` keeps the path with `TreeSubscriber` on create, reads `children`, `ancestors` and `descendants` on
  `CrudService`, moves a subtree with `CrudService.move(id, parentId)` (the `repath` prefix rewrite on `treePath`), refuses
  `parentId` in `update`, `updateWhere` and `upsert`, and adds the blueprint macro `t.tree()` (`parent_id`, `tree_path`
  with a GiST index).
- d5e5ff8: `MetricsReader` widens (reporting gap 10): `value(aggregate, path?)` takes the new `Aggregate.Avg`, `Min`, `Max` and
  `Distinct` beside `Count` and `Sum`; `series(aggregate, path?, grain)` buckets by the new `MetricGrain` (hour, day,
  week, month, quarter) on the local calendar of `MetricsOptions.timeZone`, which `CrudService.metrics` defaults to the
  running call's time zone (else UTC), so a day across a daylight-saving change is one local day; `breakdown(dimension,
  aggregate, path?, limit)` groups a metric by a field, largest first. `MetricSeries` buckets are now keyed by the local
  calendar, so a window that does not start on a bucket boundary may have one more bucket in its previous period.
- b62c042: System fields and validation on flush (stackra-287). `@stackra/model` adds `SYSTEM_FIELDS` (the system-written
  fields by trait), the `SystemField` type, `systemFieldsOf(model)` and the `ValidateOnFlush` trait. `CrudService`
  `create`, `insert`, `insertMany`, `upsert`, `update` and `updateWhere` refuse data that sets one of the model's system
  fields with `SystemFieldWriteError` (a create may still mint its id). `ValidateOnFlushSubscriber` checks each written
  row of a `ValidateOnFlush` model against its generated schema and refuses the flush with `ModelInvalidError`.
- 0a20a9f: Outbox change feed (ADR 0078 and 0221, amended 2026-10-28). Row changes go to a retained, day-partitioned
  `outbox.changes` log (migration `outbox.0004_create_changes`) instead of being deleted on delivery; each change
  consumer reads it from its own cursor (`outbox.change_cursors`), with backoff and a stall that drops nothing.
  `RowChange` gains opt-in `before`/`after` values (the new `CapturesChanges({ values, exclude })` trait and
  `changeCaptureOf` in @stackra/model drop encrypted and `@Classified` fields). New: the `ChangeFeed` port with memory
  and Postgres drivers, `ChangeFeedService` (`replay`, `resume`, `backfill`), `ChangeFeed.maintain` (run daily by
  `data_maintenance.change_log.maintain`) and
  `outbox.changeRetentionDays`, `ChangeConsumer.consumeMany` with `coalesceChanges`, and the `@ConsumesChanges(Model)`
  facet, which gen turns into `registerChangeConsumers` rows. @stackra/database adds `NativeWriteWatcher` and
  `connectNativeWriteWatcher`, so `CrudService`'s native verbs report their rows to the feed.
- d5f5acf: Add the native `uuid` storage of public ids (ADR 0135 and 0134, 2026-10-28 amendments): `publicIdToUuid` and
  `uuidToPublicId`, the `PublicIdType(prefix)` key column type, `LinkType(model, prefix)` for a `uuid` link column, and
  the compiler's `publicIds: "uuid"` option that writes `hasPublicId`, `belongsTo` and `link` columns as `uuid`.
- 3d0354e: Query telemetry, the N+1 guard, batched link loading and a request memo (stackra-282). `@stackra/database` counts every
  statement through one ORM logger (normalised shapes, no values), hands a `QuerySample` to the new `QueryObserver`
  observers (`DatabaseOptions.observers`; `LoggerQueryObserverDriver` logs `database.slow_query`), ships
  `DatabaseQueryBudgetDriver` for the new actions `QueryBudget` port, `DatabaseConfig.queries` (slow, repeats, strict),
  `strictLoading` in `./testing`, `Extension.PgStatStatements` (ADR 0160 note) and batched `GraphQuery` relations.
  `@stackra/actions` adds the `queryBudget` option and `ctx.memo`. `@stackra/model` adds `Link.loadMany` and
  `Link.useBatchResolver`. `@stackra/infra-gcp` sets `log_min_duration_statement` and `auto_explain` from
  `shared.database.slowQueryMs` (1000 ms by default, `false` turns it off).
- b163445: Add `Query({ reads: "replica" })`: the pipeline runs the query's `handle` on a read replica through the new
  `ReplicaReads` port, except inside the caller's read-your-writes window after its own committed action (recorded per
  instance, or carried by the transport as `CallOptions.lastWriteAt`). `@stackra/database` ships
  `DatabaseReplicaReadsDriver` over `Database.onReplica` and `DatabaseConfig.readYourWrites` (5 seconds by default)
  (stackra-402, STA-1504).
- 6745073: Retention engine (ADR 0134 decision 3, ADR 0189 decision 4). @stackra/model adds the
  `Retention({ keep, basis, policy: "archive" | "soft" | "hard" })` trait. @stackra/database adds `pruneRecords` and
  `pruneAllRecords`, which the nightly per-scope `data_maintenance.record.prune` job of `@stackra/data-maintenance` runs:
  expired rows are archived, soft-deleted or deleted in
  keyset chunks that ask the `HoldRegistry` with `Disposal.Retention`, and every `SoftDeletes` model's rows deleted
  more than 30 days ago are purged. @stackra/outbox adds `OutboxDriver.pruneDead`, the `outbox.pruneAfterDays` setting
  and `pruneOutbox`, which the daily `data_maintenance.outbox_message.prune` job runs to delete old dead letters and
  inbox ids.
- f746759: Row-level security conformance (stackra-258). `@stackra/database/testing` adds `assertRowSecurity` (every table
  holding the owner column has forced row-level security and its `pol_<table>_<column>` policy, the service role does
  not bypass it, and a rolled-back two-owner probe sees and moves nothing) and `usePostgres({ migrationsDirectory })`.
  `@stackra/tenancy/testing` adds `tenantIsolationOptions()`. Gen refuses a service model that is neither owned nor
  `Model.global` (`model_tenancy_missing`), records `global` on manifest models, and writes
  `.stackra/tests/tenant-isolation.int.test.ts` for a service with owned models.
- a31d463: Move a scope subtree (ADR 0411): `ScopeNodeService.move(scope, parent)` re-paths the node and its descendants in one
  statement and records `ScopeMoved` (`scope.node.moved.v1`); a parent at or below the node is `ScopeMoveInvalidError`.
  `CrudService.repath(from, to)` rewrites the `ltree` prefix of a service's own `scope_path` rows from its listener.
- 3e2fc84: `CrudService.table(input, { count })` adds the matching rows' count to the page (`page.count`, a `TableCount`).
  `Count.Estimated` counts exactly up to 10,000 rows (`BULK_LIMITS.countCap`) and past it reports the cap with the
  planner's estimate; `Count.Exact` counts every row (ADR 0307 rule 12, reporting gap 6). `Count` now lives in
  `@stackra/database`; `@stackra/panel` re-exports it, and the resource list shows the count beside the filter bar,
  capped as "10,000+" (new `panel::resources.count` and `count_capped` texts in all seven locales).
- 5e8114b: Resource tables get the full filter and sort vocabulary (reporting gap 5, ADR 0307 rule 2). `@stackra/database`:
  `CrudService.table` reads each filter value as a `TableFilter` (a value, a list, or `{ op }` for `range`,
  `dateRange` with bounds or a named relative range resolved by the new `TableOptions.period`, `gt`/`gte`/`lt`/`lte`/`ne`,
  `contains` and `isNull`) and a multi-key sort (`TableSort[]`, three keys at most, the primary key last). Any other
  object filter value, which used to reach MikroORM as is, is now refused with `table_filter_invalid`
  (`TableFilterInvalidError`). `@stackra/panel`: `Filter.range`, `Filter.dateRange`, `Filter.compare` with the new
  `FilterComparison` enum, `Filter.contains`, `Filter.isNull` (and the same on the table builder's filter factory),
  `.thenSort(key, direction)` tiebreak keys on the default sort, and `tableInput` sends each drawn value in its wire form;
  the web list draws range, date-range and is-null filters with `@stackra/ui`'s number, date-range and boolean editors.
  `@stackra/gen`: the full pass refuses a recorded resource table that sorts or filters on a path no index leads with
  (`sort_not_indexed`, `filter_not_indexed`).
- 2c0ea71: Placement (stackra-310). `@stackra/database` adds the `ConnectionResolver` port and `PRIMARY_CONNECTION`
  (`./contracts`), the free one-pool `PrimaryConnectionResolverDriver` (`./node`) and `DatabaseConfig.region`, the runway
  region key of the deployment. `@stackra/tenancy` adds the placement map: the `Placement` type (a tenant's `region` and
  `cell`), the `TenantPlacement` port with `MemoryTenantPlacementDriver`, `tenantOf`, `RegionGuardDriver` (a
  `TenancyCheck` that refuses `region_mismatch` with `RegionMismatchError` when a call's tenant is placed in another
  region, and fails closed without a placement or a region key) and `TenantPlacementConnectionResolverDriver`, which names
  the tenant's cell.
- ab9cc36: Add the `TimeSeries<S>({ key, time, dimensions, measures, rollups, lateness, retain })` kind (data-layer gap cdc7):
  scheduler-kept rollup tables `ts_<key>_<grain>` over a big append-only source. `registerTimeSeries` pairs a series with
  its source model, `rollUpTimeSeries(series, now)` recomputes the recent UTC buckets and prunes expired ones,
  `rollupTable(key, grain)` names a rollup table, and `rollUpAllTimeSeries(now)` runs it for every registered series; the
  `RollUpTimeSeriesAction` job of `@stackra/data-maintenance` (`data_maintenance.timeseries.rollup@1`) calls it every 15
  minutes per scope.

### Patch Changes

- 936fcb1: `TimeSeries` reads its options' field names as strings, and the observed MikroORM logger passes only a context with a
  statement to MikroORM's own logger (a context without one is neither printed nor counted).
- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- ae9621e: Reports return server subtotals per leading dimension (`subtotals: true`) and a pivot matrix with row and column
  totals (`pivot: { rows, columns }`), all from one grouping-sets statement. The panel's `Aggregate` is now
  `@stackra/database`'s (`average` becomes `avg`, `distinct` is added); `groupRows` is for fully loaded tables only.
- 47554e7: `SHARED_CACHE_CONTEXT` has one home: `@stackra/actions` exports it from its `.` entry, and `@stackra/database`'s entity
  cache and cache invalidation import it from there instead of declaring their own copy.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [c547718]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [4502f57]
- Updated dependencies [bc4acfc]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [e7ee0a4]
- Updated dependencies [38a5501]
- Updated dependencies [a701ccb]
- Updated dependencies [a526605]
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [483eb44]
- Updated dependencies [acff14a]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [3d080e7]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [9841d79]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [c580aa4]
- Updated dependencies [7e60fa9]
- Updated dependencies [b62c042]
- Updated dependencies [e52a367]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [0a20a9f]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [376a093]
- Updated dependencies [158f6cf]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [e344058]
- Updated dependencies [2787c1e]
- Updated dependencies [a65c6bc]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/cache@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/model@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

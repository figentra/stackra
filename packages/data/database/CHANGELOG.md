# @stackra/database

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

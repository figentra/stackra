# @stackra/model

## 0.32.0

### Patch Changes

- @stackra/money@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/events@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- @stackra/money@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/events@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Patch Changes

- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [8c17109]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
  - @stackra/contracts@0.30.0
  - @stackra/container@0.30.0
  - @stackra/money@0.30.0
  - @stackra/events@0.30.0
  - @stackra/validation@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [b4b6422]
  - @stackra/container@0.29.0
  - @stackra/money@0.29.0
  - @stackra/events@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- @stackra/money@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/events@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- @stackra/money@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/events@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- @stackra/money@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/events@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- @stackra/money@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/events@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- @stackra/money@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/events@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- @stackra/money@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/events@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [acbee14]
  - @stackra/events@0.22.0
  - @stackra/money@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/validation@0.22.0

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
  - @stackra/money@0.21.0
  - @stackra/container@0.21.0
  - @stackra/events@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [a7b7e58]
- Updated dependencies [667a3b5]
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/money@0.20.0
  - @stackra/events@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [bac874e]
  - @stackra/contracts@0.19.0
  - @stackra/money@0.19.0
  - @stackra/container@0.19.0
  - @stackra/events@0.19.0
  - @stackra/validation@0.19.0

## 0.18.1

### Patch Changes

- @stackra/money@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/events@0.18.1
  - @stackra/validation@0.18.1

## 0.18.0

### Patch Changes

- @stackra/money@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/events@0.18.0
  - @stackra/validation@0.18.0

## 0.17.2

### Patch Changes

- @stackra/money@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/events@0.17.2
  - @stackra/validation@0.17.2

## 0.17.1

### Patch Changes

- @stackra/money@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/events@0.17.1
  - @stackra/validation@0.17.1

## 0.17.0

### Patch Changes

- @stackra/money@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/events@0.17.0
  - @stackra/validation@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/events@0.16.0
  - @stackra/money@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/money@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/events@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- @stackra/money@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/events@0.14.4
  - @stackra/validation@0.14.4

## 0.14.3

### Patch Changes

- @stackra/money@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/events@0.14.3
  - @stackra/validation@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/money@0.14.2
  - @stackra/events@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/money@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/events@0.14.1
  - @stackra/validation@0.14.1

## 0.14.0

### Patch Changes

- @stackra/money@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/events@0.14.0
  - @stackra/validation@0.14.0

## 0.13.0

### Patch Changes

- @stackra/money@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/events@0.13.0
  - @stackra/validation@0.13.0

## 0.12.0

### Patch Changes

- @stackra/money@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/events@0.12.0
  - @stackra/validation@0.12.0

## 0.11.1

### Patch Changes

- @stackra/money@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/events@0.11.1
  - @stackra/validation@0.11.1

## 0.11.0

### Patch Changes

- @stackra/money@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/events@0.11.0
  - @stackra/validation@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
  - @stackra/contracts@0.10.0
  - @stackra/money@0.10.0
  - @stackra/container@0.10.0
  - @stackra/events@0.10.0
  - @stackra/validation@0.10.0

## 0.9.0

### Patch Changes

- b174a17: `stackra db diff` reports pivots, search columns and partial indexes faithfully. `expectedSchema` now expects each
  many-to-many relation's pivot table, named by `pivotTable` or `<table>_<field>`, with the two `varchar(33)` keys the
  ORM names (`<owner>_id` and `<target>_id`, or `<table>_1_id` and `<table>_2_id` for a self-reference), the owner's
  `tenant_id` and their same-module foreign keys, so a migrated pivot is no longer `undeclared_table`. A `@Searchable`
  model expects `search_text` and `search_filters`; `diffSchemas` tolerates the search vectors and `__v<n>` shadows only
  on such a table and reports search columns on any other table as `undeclared_column`. A partial index's predicate
  compares as Postgres renders it (multi-word and array casts, quoted identifiers, `<>`, `= ANY`, `<> ALL`, `~~` and
  `between` folded), so a correct partial index is no longer `index_shape`.
  
  `ManyToManyOptions` documents the pivot name the ORM uses without the option, `<table>_<field>`.
- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/container@0.9.0
  - @stackra/events@0.9.0
  - @stackra/money@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [7dd35b3]
  - @stackra/container@0.8.0
  - @stackra/money@0.8.0
  - @stackra/events@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/money@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/events@0.7.1
  - @stackra/validation@0.7.1

## 0.7.0

### Patch Changes

- @stackra/money@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/events@0.7.0
  - @stackra/validation@0.7.0

## 0.6.1

### Patch Changes

- @stackra/money@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/events@0.6.1
  - @stackra/validation@0.6.1

## 0.6.0

### Patch Changes

- @stackra/money@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/events@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- @stackra/money@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/events@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- @stackra/money@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/events@0.5.0
  - @stackra/validation@0.5.0

## 0.4.0

### Minor Changes

- 2bbc0e8: Add the AI-everywhere retrieval lane of `@stackra/search` (STA-1636, ADR 0492 decisions 4, 5 and 8).
  
  - `Reranker` port with `HttpRerankerDriver` (text-embeddings-inference `/rerank`, token from `SecretStore` at call time,
    `search.reranker`) and `MemoryRerankerDriver`; `runRerankerConformance` in `./testing`. `SearchIndex` reranks the first
    `topN` fused candidates when a read passes `rerank: true` or the model declares `@Searchable({ rerank: true })`
    (new in `@stackra/model`); with no reranker, or when it fails, the fused order stands.
  - Arabizi also applies to any Latin word when the read's locale is Arabic (`arabiziOf(word, anyLatin)`).
  - Tenant synonyms as data: the `SynonymSource` port with `MemorySynonymSourceDriver`, and query expansion in
    `SearchIndex` (the rows, actions and database driver are `@stackra/data-maintenance`'s, so search stays below iam).
  - `Recommender` port (`similar`, `boughtTogether`) with `PostgresRecommenderDriver`, `HttpRecommenderDriver` (the
    `tools-recommend` contract) and `MemoryRecommenderDriver`; `search.recommender` config.
  - Evaluation set in `./testing` (catalogue, judged Arabic, English and mixed queries, `ndcgAt`, `recallAt`, thresholds) and
    a `test:int` script that fails when NDCG@10 or recall@50 drops under them.

### Patch Changes

- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
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
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/container@0.4.0
  - @stackra/events@0.4.0
  - @stackra/money@0.4.0

## 0.3.0

### Minor Changes

- 23e556c: Adds `CredentialDataClass` (ai never, support hidden, search no_snippet, export excluded) and `ExportLabel.Excluded` (STA-1677, ADR 0494).

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/events@0.3.0
  - @stackra/money@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [9085c41]
  - @stackra/contracts@0.2.0
  - @stackra/money@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 38a5501: Add native time partitioning: the `Partitioned({ by, interval, premake, retain })` trait, the blueprint's
  `t.partitionBy(column)` (range partitioning, a default partition, the column in the primary key, a BRIN index),
  `maintainPartitions`, and `maintainAllPartitions`, which creates partitions ahead and drops expired ones unless a
  legal hold covers a row; the daily job that runs it is `@stackra/data-maintenance`'s.
- a526605: Make the delete policies work: the drivers register the `deleted` and `archived` filters for `SoftDeletes` and the new
  `Archivable` trait, `CrudService` gains `delete` (soft delete, archive or hard delete by the model's traits),
  `restore` and `forceDelete`, its reads take `withDeleted`/`onlyDeleted`/`withArchived`/`onlyArchived`, `purge`
  reaches kept rows, and the blueprint gains `t.archivable()`.
- 6bb8ea8: Look up an encrypted field by equal value (gap gov9). `HasEncryptedFields({ lookup: ["email"] }, "email")` makes
  `EncryptedFieldsSubscriber` write a blind index, an HMAC of the plain text under a key derived from the scope's data
  key, to the model's `emailBidx` property on each seal; `whereEncrypted(em, keys, Lead, "email", value)` builds the
  matching filter and `encryptedLookupOf` reads the lookup fields. The subscriber takes the scope's `KeyProvider` as a
  new optional third argument, required once a model has lookup fields. `EncryptedFieldsResealService` rewrites the
  index with its value and backfills a missing one. `EncryptedFieldsOptions.subject` is now optional, and `lookup`
  cannot be combined with `subject`.
- e45cd73: Finish key rotation for encrypted fields (gap gov7). `EncryptedFieldsResealService.usage` reports how many sealed
  values rest under each data key and how many rows are still off the current key, so an old key can be retired;
  `reseal` opens and seals again, a page at a time with a resumable cursor, every value still under an older key, with
  the scope's cipher or the subject's for a subject-sealed model, and never overwrites a row a write changed meanwhile.
- 6006b78: Bind encrypted fields to the scope that owns the row (gap gov8, ADR 0476). `HasEncryptedFields({ scope: "tenantId" },
  ...fields)` seals and opens each value in `<model key>.<field>@<scope id>`, so a value copied into another scope's row
  does not open; the subscriber and `EncryptedFieldsResealService` read the id from the row and refuse a row without
  one, and `encryptedScopeOf` reads the option. `@stackra/ai`'s `Message` now declares its content this way, and
  `ScopeKeyCast` is removed from `@stackra/ai/node`: `PostgresConversationStoreDriver` takes only its two repositories.
- 483eb44: Add the `Cached({ ttl })` model trait and `cacheTtlOf` (@stackra/model; a model with encrypted fields is refused).
  `CrudService.findOne` and `findOneOrFail` by `{ id }` alone, outside a transaction and with no visibility condition,
  read a `Cached` model's row through the shared `Cache` (MikroORM's result cache over `EntityResultCacheAdapter`, set by
  `PostgresDatabaseDriver`), keyed by `CacheKey.of(Model, id, scopeId, scopeNodeId)`. New `CacheInvalidationService`, an
  outbox change consumer that forgets `CacheKey.of(Model, id)` after every committed change. @stackra/database now
  depends on `@stackra/cache` (data-layer gaps ca4, ca5, cdc10; STA-1431).
- 3d080e7: Add the `HasTree` trait (ADR 0321, data-layer gap mo16): `parentId` and an `ltree` `treePath`, a new system field.
  `@stackra/database` keeps the path with `TreeSubscriber` on create, reads `children`, `ancestors` and `descendants` on
  `CrudService`, moves a subtree with `CrudService.move(id, parentId)` (the `repath` prefix rewrite on `treePath`), refuses
  `parentId` in `update`, `updateWhere` and `upsert`, and adds the blueprint macro `t.tree()` (`parent_id`, `tree_path`
  with a GiST index).
- 9841d79: Add `@DocumentNumber({ sequence })`, the field marker of a legal document number taken from a gapless sequence (STA-756,
  ADR 0342).
- d156aa8: Add field encryption (owner decision 23, gap R-36): the `HasEncryptedFields(...fields)` trait names a model's string
  fields that rest encrypted, `encryptedFieldsOf(Model)` reads them, and `EncryptedFieldsSubscriber`, an ORM subscriber
  built with the `FieldCipher` port, seals them before a create, update or upsert and opens them on load under the
  context `<model key>.<field>`. A null stays null. Hosts pass the subscriber in `DatabaseOptions.subscribers` until the
  generated boot registers it (STA-339).
- 2787c1e: Add `@stackra/model`: the `Model` kind base with `Model.with(...traits)` and `record(event)`, the traits
  `HasPublicId(prefix)` (UUIDv7 public ids), `Timestamps`, `UserStamps`, `Versioned`, `SoftDeletes`, `AppendOnly` and
  `Translatable(fields)`, with `createTrait` and `traitsOf` for traits other packages own (tenant ownership is
  `@stackra/tenancy`'s `BelongsToTenant`). Relations are `@ManyToOne`, `@OneToMany` and `@ManyToMany` over `Ref<T>`,
  `Collection<T>` and, across modules, `Link<T>` (an id-only reference loaded through the owning module's read), with
  `OnDelete`. `@Index` and `@Searchable` declare table facts, and `@Visibility({ attributes, follows })` declares that a
  model's records are visible by rule (ADR 0333), which `@stackra/iam/node` pushes into its reads. `Translated` holds a
  per-locale string with a fallback chain, and `Attributes<M>` types factory definitions. Generated entity metadata imports `LinkType`, `TranslatedType`
  and `MoneySchema`, whose amount column refuses a value beyond `Number.MAX_SAFE_INTEGER`. The old `./traits` and
  `./orm` entries are folded into `.`.
- 7e60fa9: `@Searchable` takes `semantic?: boolean`, kept in its frozen options. It turns on gen's `searchable_semantic_ai_never`
  check and @stackra/search's semantic indexing (STA-1326, ADR 0380).
- b62c042: System fields and validation on flush (stackra-287). `@stackra/model` adds `SYSTEM_FIELDS` (the system-written
  fields by trait), the `SystemField` type, `systemFieldsOf(model)` and the `ValidateOnFlush` trait. `CrudService`
  `create`, `insert`, `insertMany`, `upsert`, `update` and `updateWhere` refuse data that sets one of the model's system
  fields with `SystemFieldWriteError` (a create may still mint its id). `ValidateOnFlushSubscriber` checks each written
  row of a `ValidateOnFlush` model against its generated schema and refuses the flush with `ModelInvalidError`.
- e52a367: Add the `Commentable`, `HasAttachments`, `Taggable` and `HasCorrections` traits with `currentRows` (the correction
  chain of ADR 0321), `Model.global` and `Model.isGlobal` (ADR 0210 amendment), `ModelAddition` (ADR 0336), the data
  classes of ADR 0341 (`DataClass`, `PrivilegedDataClass`, `@Classify` and the four effect enums), and `@Meter` with
  `MeterKind` (ADR 0216). `MODEL_KINDS` now includes `model_addition`.
- a681685: `AssuranceLevel` and `MeterKind` have one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/actions/contracts`
  and `@stackra/identity` no longer export `AssuranceLevel`, and `@stackra/actions` and `@stackra/model` no longer export
  `MeterKind`; import both from `@stackra/contracts`. The codes are unchanged.
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
- 6745073: Retention engine (ADR 0134 decision 3, ADR 0189 decision 4). @stackra/model adds the
  `Retention({ keep, basis, policy: "archive" | "soft" | "hard" })` trait. @stackra/database adds `pruneRecords` and
  `pruneAllRecords`, which the nightly per-scope `data_maintenance.record.prune` job of `@stackra/data-maintenance` runs:
  expired rows are archived, soft-deleted or deleted in
  keyset chunks that ask the `HoldRegistry` with `Disposal.Retention`, and every `SoftDeletes` model's rows deleted
  more than 30 days ago are purged. @stackra/outbox adds `OutboxDriver.pruneDead`, the `outbox.pruneAfterDays` setting
  and `pruneOutbox`, which the daily `data_maintenance.outbox_message.prune` job runs to delete old dead letters and
  inbox ids.
- 158f6cf: Search facet field kinds (data-layer gap se9). `@Searchable` gains `sortable`, `ranges`, `boost` (a text field's
  weight letter) and `when` (the values a field must hold for a row to be searchable). `find`, `page` and `facets` take
  a list as a filter value (any of them), `ranges` with `gte`/`gt`/`lte`/`lt` bounds, and `find`/`page` take up to three
  `sort` keys before relevance. The `SearchDriver` port gains `fieldKinds` and the request `anyOf`, `ranges` and `sort`;
  the memory and Postgres drivers apply them, and the conformance suite adds `filters.any-of`, `filters.range` and
  `sort.by-field`.
- c3ff8a7: Seal a subject's fields under that subject's own key, so an erasure that shreds them is real (gap gov2).
  `HasEncryptedFields({ subject: "userId" }, ...fields)` makes `EncryptedFieldsSubscriber` seal and open each row with
  the new `SubjectCipherResolver` port, and an erased subject's fields load as null. `@stackra/privacy` adds
  `SaltedSubjectCipherResolverDriver`, the `PostgresSubjectSaltStoreDriver` over the new `privacy.subject_salts` table
  (migration 0001, partitioned per tenant), and `unsealedShredFields`. `EraseSubjectWorkflow` now refuses to erase while
  a `Shred` field is not subject-sealed. `SubjectSaltStore` gains `find` and `obtain`, so custom drivers must implement
  both.
- 8a1be69: The remaining v3 field decorators of ADR 0294 R6: `@Lowercase` (a transform gen compiles to `.toLowerCase()`),
  `@Hidden` and `@Visible({ audience })` with `OutputAudience` (serializers) in `@stackra/validation`, and `@OneToOne`
  in `@stackra/model`. Gen leaves a `@Hidden` field out of the shape's `X$`, its `X$Check` and the manifest's JSON
  Schema, so it never goes out on the wire (stackra-260).

### Patch Changes

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
- c580aa4: The `Retention` trait's docs name the retention job by its new key, `data_maintenance.record.prune`.
- 8c7a376: One public-id minter (STA-1380, ADR 0135). `@stackra/contracts` exports `mintPublicId(prefix, time?)`: the prefix and
  the lowercase Crockford base32 of a UUIDv7, in minting order within one process (also within one millisecond and when
  the clock steps back). `@stackra/model`'s `HasPublicId`, `@stackra/actions`' audit and usage events and
  `@stackra/outbox`'s writer all mint with it, so every `evt_` id has one form. The internal minters of actions (random
  lowercase), outbox (uppercase ULID) and model are removed. Ids already stored in the older forms keep working: the
  outbox's `evt_` check and the inbox's claim compare ids as strings.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [0abe92d]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [c56d7fe]
- Updated dependencies [2787c1e]
- Updated dependencies [5fe0327]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/events@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/money@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

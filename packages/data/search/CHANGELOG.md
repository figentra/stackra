# @stackra/search

## 0.19.0

### Minor Changes

- 9063bb3: A multi-word search also returns the rows that hold only some of its words, after every full match: the Postgres
  driver adds a partial lane and ranks its rows below every row a full lane found, so full matches keep their order and
  partial ones fill the tail. A one-word search is unchanged. The evaluation set's recall@50 now reaches its threshold.

### Patch Changes

- d76d1ed: The expand step of tenancy audit gap D: each scope-path table gains a nullable, indexed `tenant_id` that every insert
  fills from `app.tenant_id` (`t.belongsToTenant({ expand: true })`), with no policy change, so no session reads a row
  more or less. Migrations: `achievements.0003_add_tenancy` (`award_kinds`, `awards`), `rules.0004_add_tenancy`
  (`rule_sets`), `segments.0002_add_tenancy` (`segments`, `segment_memberships`), `content.0005_add_tenancy`
  (`custom_fields`, `custom_field_value_sets`, `revisions`), `search.0008_add_tenancy` (`vector_items`, `queries`),
  `collaboration.0003_add_tenancy` (the four comment tables) and `workflow.0010_add_tenancy` (`automations`, `checklists`,
  `checklist_progresses`). Each package now depends on `@stackra/tenancy` for the macro. Older rows stay null until a
  backfill job sets them; the contract step (NOT NULL, the tenant equality as the one permissive policy, the scope path
  restrictive) follows in a later release.
- 6ec440d: Each package's tenancy expand migration now carries the package's name, in its class and its file
  (`AddAchievementsTenancyMigration` in `0003-add-achievements-tenancy.migration.ts`, and so on), so no exported name is
  declared in two packages. The SQL is unchanged. The migration ids change with the file names
  (`achievements.0003_add_achievements_tenancy`); these migrations ship first in this release, so no database has
  applied the old ids.
- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [b59aa22]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
- Updated dependencies [12f25aa]
- Updated dependencies [e5f5432]
- Updated dependencies [40fda23]
- Updated dependencies [0da5f7a]
- Updated dependencies [0921f1f]
- Updated dependencies [dd9427a]
- Updated dependencies [4a23af8]
- Updated dependencies [fc845f4]
- Updated dependencies [0e0de4f]
- Updated dependencies [0e0de4f]
- Updated dependencies [e5ac3d0]
- Updated dependencies [d2b3d22]
- Updated dependencies [eafb209]
- Updated dependencies [d22e767]
- Updated dependencies [e283a31]
- Updated dependencies [27f2b3f]
- Updated dependencies [15d8a1b]
- Updated dependencies [bc5a0ab]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/tenancy@0.19.0
  - @stackra/database@0.19.0
  - @stackra/config@0.19.0
  - @stackra/model@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/i18n@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/outbox@0.19.0
  - @stackra/settings@0.19.0

## 0.18.1

### Patch Changes

- @stackra/actions@0.18.1
  - @stackra/database@0.18.1
  - @stackra/model@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/i18n@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/outbox@0.18.1
  - @stackra/settings@0.18.1

## 0.18.0

### Patch Changes

- @stackra/actions@0.18.0
  - @stackra/database@0.18.0
  - @stackra/model@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/i18n@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/outbox@0.18.0
  - @stackra/settings@0.18.0

## 0.17.2

### Patch Changes

- @stackra/actions@0.17.2
  - @stackra/database@0.17.2
  - @stackra/model@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/i18n@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/outbox@0.17.2
  - @stackra/settings@0.17.2

## 0.17.1

### Patch Changes

- @stackra/settings@0.17.1
  - @stackra/actions@0.17.1
  - @stackra/database@0.17.1
  - @stackra/model@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/i18n@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/outbox@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/database@0.17.0
  - @stackra/model@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/i18n@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/outbox@0.17.0
  - @stackra/settings@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [c6e4715]
- Updated dependencies [5bf8ad3]
  - @stackra/settings@0.16.0
  - @stackra/validation@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/database@0.16.0
  - @stackra/model@0.16.0
  - @stackra/config@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/i18n@0.16.0
  - @stackra/outbox@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [0b0cf51]
  - @stackra/outbox@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/database@0.15.0
  - @stackra/model@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/i18n@0.15.0
  - @stackra/validation@0.15.0
  - @stackra/settings@0.15.0

## 0.14.4

### Patch Changes

- Updated dependencies [6406843]
- Updated dependencies [cc150d2]
  - @stackra/settings@0.14.4
  - @stackra/actions@0.14.4
  - @stackra/database@0.14.4
  - @stackra/model@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/i18n@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/outbox@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/database@0.14.3
  - @stackra/model@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/i18n@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/outbox@0.14.3
  - @stackra/settings@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/database@0.14.2
  - @stackra/model@0.14.2
  - @stackra/config@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/i18n@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/outbox@0.14.2
  - @stackra/settings@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/database@0.14.1
  - @stackra/model@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/i18n@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/outbox@0.14.1
  - @stackra/settings@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/database@0.14.0
  - @stackra/model@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/i18n@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/outbox@0.14.0
  - @stackra/settings@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/database@0.13.0
  - @stackra/model@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/i18n@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/outbox@0.13.0
  - @stackra/settings@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/database@0.12.0
  - @stackra/model@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/i18n@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/outbox@0.12.0
  - @stackra/settings@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/database@0.11.1
  - @stackra/model@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/i18n@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/outbox@0.11.1
  - @stackra/settings@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/database@0.11.0
  - @stackra/model@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/i18n@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/outbox@0.11.0
  - @stackra/settings@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/i18n@0.10.0
  - @stackra/outbox@0.10.0
  - @stackra/settings@0.10.0
  - @stackra/model@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [b174a17]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/model@0.9.0
  - @stackra/container@0.9.0
  - @stackra/database@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/config@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/i18n@0.9.0
  - @stackra/outbox@0.9.0
  - @stackra/settings@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/outbox@0.8.0
  - @stackra/settings@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/model@0.8.0
  - @stackra/config@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/i18n@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/actions@0.7.1
  - @stackra/database@0.7.1
  - @stackra/model@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/i18n@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/outbox@0.7.1
  - @stackra/settings@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [1f5bf76]
  - @stackra/settings@0.7.0
  - @stackra/actions@0.7.0
  - @stackra/database@0.7.0
  - @stackra/model@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/i18n@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/outbox@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/database@0.6.1
  - @stackra/model@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/i18n@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/outbox@0.6.1
  - @stackra/settings@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [fb29d41]
  - @stackra/database@0.6.0
  - @stackra/outbox@0.6.0
  - @stackra/settings@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/model@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/i18n@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/outbox@0.5.1
  - @stackra/settings@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/model@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/i18n@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [d7f72d3]
  - @stackra/i18n@0.5.0
  - @stackra/settings@0.5.0
  - @stackra/actions@0.5.0
  - @stackra/database@0.5.0
  - @stackra/model@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/outbox@0.5.0

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

- Updated dependencies [71b37fc]
- Updated dependencies [7a94bc4]
- Updated dependencies [a7eaed4]
- Updated dependencies [a8c358a]
- Updated dependencies [0b660e0]
- Updated dependencies [0b660e0]
- Updated dependencies [3ce01cf]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [4f3f1ed]
- Updated dependencies [e070131]
- Updated dependencies [d675b4d]
- Updated dependencies [3df2c07]
- Updated dependencies [2d6bb63]
- Updated dependencies [7dc74f6]
- Updated dependencies [d9bf3c2]
- Updated dependencies [90f55b1]
- Updated dependencies [1c22c33]
- Updated dependencies [688cf0c]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [5fc0db7]
- Updated dependencies [36dbd49]
- Updated dependencies [2bbc0e8]
- Updated dependencies [9574c22]
- Updated dependencies [f490040]
- Updated dependencies [2f5ab1e]
- Updated dependencies [dbb60dc]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/settings@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/container@0.4.0
  - @stackra/outbox@0.4.0
  - @stackra/model@0.4.0
  - @stackra/config@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/i18n@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [a60f4e9]
- Updated dependencies [c4443b5]
- Updated dependencies [b00096a]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [be75ede]
- Updated dependencies [a60f4e9]
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/i18n@0.3.0
  - @stackra/model@0.3.0
  - @stackra/outbox@0.3.0
  - @stackra/settings@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/outbox@0.2.0
  - @stackra/settings@0.2.0
  - @stackra/model@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/i18n@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- fb93026: Erasure fan-out, P0 part (data-layer gap gov6, ADR 0189 decision 2). @stackra/outbox adds `OutboxDriver.holding(value)`
  and `OutboxDriver.rewrite(id, data)` (memory and Postgres drivers; a custom driver must implement both) and
  `redactSubjectMessages(driver, subject, fields)`, which nulls the named fields in every held message, due, retrying or
  dead, whose payload names the subject. @stackra/search adds `SearchForgetService.forget(Model, ids)`, which drops rows
  from the search index and, for a semantic model, the vector index, and `passageIdOf`. @stackra/privacy's erasure saga
  gains a `redact` step before `shred` (its constructor now takes the `OutboxDriver`) and counts rewritten messages in
  the receipt as `outbox.message`; the new `UnindexErasedSubjectListener` removes the subject's remaining rows from search
  after `SubjectErased`.
- 37e1aa8: Round D. search: synonym sets per index and language as settings data (`search.synonyms`), applied by both Postgres
  lanes; `find`/`page`/`facets` take `locale`. events: `IntegrationEvent({ crossRegion: true })`, the `RegionBus` port,
  `crossRegionRecords` and `RegionBusFake`. infra-gcp: static egress addresses (`shared.network.egress.staticIps`).
  versioning: deprecated dated versions are served until their support window ends (`VERSION_SUPPORT_MONTHS`), then
  refused; `applyVersionHeaders`. infra-tools:
  OCR and Photon images, tool databases and Valkey, Infisical secret sync, EBS-backed tools.
- cf64395: <!-- Purpose: release note for stackra-195: the SearchDriver conformance suite in @stackra/search/testing. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0089 d5, ADR 0461. -->
  
  Add the `./testing` entry with the `SearchDriver` conformance suite (ADR 0089 d5): `runSearchConformance(makeDriver,
  options?)` runs `SEARCH_CONFORMANCE_CASES` (every word, prefixes, alternatives, filters, offset and limit, facets,
  re-indexing, removal, refusing record visibility) on a fresh driver over its own `conformance_<case>` table seeded with
  `SEARCH_CONFORMANCE_DOCUMENTS`, and returns each case's mismatches. Framework-free and importing only `./contracts`, so
  the Pro Meilisearch and OpenSearch drivers (ADR 0461) run the same rules as the memory driver.
- 158f6cf: Search facet field kinds (data-layer gap se9). `@Searchable` gains `sortable`, `ranges`, `boost` (a text field's
  weight letter) and `when` (the values a field must hold for a row to be searchable). `find`, `page` and `facets` take
  a list as a filter value (any of them), `ranges` with `gte`/`gt`/`lte`/`lt` bounds, and `find`/`page` take up to three
  `sort` keys before relevance. The `SearchDriver` port gains `fieldKinds` and the request `anyOf`, `ranges` and `sort`;
  the memory and Postgres drivers apply them, and the conformance suite adds `filters.any-of`, `filters.range` and
  `sort.by-field`.
- 1f34fad: Count facets under record visibility (`SearchDriver.facets`, `SearchIndex.facets`), fold Arabic through `@stackra/i18n`'s
  `normalizeArabic` with the new `search.fold` SQL function (migration 0003; reindex plan in ADR 0404), read the
  embedder token from the runtime `SecretStore` (`search.embedder.tokenSecret` replaces `tokenEnv`), and pin the
  Spanish, Italian and Dutch analysers (STA-787, STA-788).
- d72a734: Add `SearchHealthIndicatorDriver`, the `HealthIndicator` named `search` that searches `health.table` for one id, and the `health` field of `SearchConfig` (probe timeout `PT2S`, `critical`, `table`, `primaryKey`) (STA-1379).
- 68ae29e: Search index registry and reindex jobs (ADR 0404 d3, ADR 0221 d7): `search.indexes` with `SearchIndexState`,
  `SearchIndexRegistry` (`list`, `invalidateChanged`, `begin`/`progress`/`finish`), `searchFacetHashOf`, resumable
  `SearchIndex.reindex({ after, since, onBatch })`, the `reindexSearch` and `reindexSemantic` work that the reindex jobs
  of `@stackra/data-maintenance` run, and the `stackra search:reindex [Model] [--scope-id --scope-path] [--since]
  [--semantic]` and `stackra search:status` commands through the member's `searchReindex` (of
  `@stackra/data-maintenance/node`) and `searchStatus` runners.
- 2787c1e: Add `@stackra/search`: the `SearchDriver` port, the `Search` reader over a model's `@Searchable` index (ranked `find`
  and cursor `page`, `index`, `remove`, `reindex`), the memory driver, the Postgres hybrid driver (full-text and
  trigram fused by reciprocal rank, Arabic normalisation), the `t.searchable(...)` migration macro, the text-function
  migration, `SearchConfig`, and automatic indexing from the outbox's row changes (`registerSearchableModels`,
  `SearchableChangeService`).
- 3649655: Search parent invalidation and a facet drift check (data-layer gaps se3, se4, se10). `registerSearchableModels` now
  also watches every model a dotted `@Searchable` path walks to (`variants.sku`) with the new `RelatedChangeService`,
  which finds the parent rows through the relation path and re-indexes them, so their documents no longer go stale.
  `SearchableChangeService` gains `consumeMany` (one `$in` load and one `index` call per run), and both consumers skip
  an update that writes no field the document reads. Gen refuses `searchable_columns_drift` when a model's
  `@Searchable` text or filters differ from the latest `t.searchable` literals of its table.
- 9811f8d: Add the search API and the Cmd+K palette (ADR 0221 d4 and d6, STA-1459): `SearchQuery(Model)` in
  `@stackra/search/node` is the base of the `<model>.search` query gen writes per `@Searchable` model, answering a phrase
  with hits of key, title and snippet under the caller's visibility (`SearchQueryInput`, `SearchQueryOutput`,
  `SearchQueryHit`); a public search is the same query with anonymous actors in the public area. `SearchPalette` in
  `@stackra/panel/react` searches those queries as the reader types and hands the picked hit to the app.
- 41035cc: The reindex jobs and the `searchReindex` runner move to the add-on `@stackra/data-maintenance` (ADR 0462 decision 1),
  which holds their system-held permissions. `./node` no longer exports `ReindexSearchAction`, `ReindexSemanticAction`,
  `ReindexSearchInput`, `ReindexSearchOutput` or `searchReindex`; it adds `reindexSearch` and `reindexSemantic`, the work
  those jobs call. The `@stackra/actions` and `@stackra/queue` dependencies go.
- 7055e31: Search ranking rules, query log and suggestions (data-layer gaps se11 to se13). `SearchSettings` gains `rankingRules`
  (pin, hide, boost and recency lines per index and phrase) and `querySample`. The `SearchDriver` port gains `appliesRules`,
  the request `pinned`, `hidden`, `boosts` and `recency`, and a `neighbours` lookup (did-you-mean); the memory and
  Postgres drivers apply them. A new `SearchQueryLog` port (memory driver in `.`, the abstract
  `PostgresSearchQueryLogDriver` in `./node` over the new `search.queries` table, whose queued `record` and its
  `data_maintenance.query.record` job are `@stackra/data-maintenance`'s) logs sampled reads and
  clicks with personal phrases withheld, and reports top, zero-result and click-through phrases. `SearchIndex` adds
  `clicked(phrase, id)` and `suggest(prefix)` (completions from the log, a did-you-mean when the prefix finds nothing),
  and `Search` takes the log as an optional fourth constructor argument.
- 1e3e28d: Scope isolation for engines outside the database (ADR 0089 d6): `SearchDocument.scope` from the row's own
  `scopeId`/`scopePath`, `SearchRequest.scopePaths` from the session's `app.scope_paths`, `SearchDriver.isolatesScopes`
  (true for Postgres, under row-level security), the memory driver filters matches and facet counts by scope, and the
  conformance cases `scope.isolated` and `facets.scoped`.
- 7e60fa9: Semantic indexing: `registerSearchableModels` also watches a `@Searchable({ semantic: true })` model with the new
  `SemanticChangeService` (`./node`, `Lifetime.Transient`), which embeds the row's text fields through the `Embedder`
  and stores the passage in the `VectorIndex` under `<Model>:<key>` in the row's scope. A runtime `ai: never` guard
  refuses a text field whose data class says `ai: never` before any text is embedded (STA-1326, ADR 0380).
- d156aa8: Add vector retrieval (owner decision 23): the `VectorIndex` (`upsert`, `query`, `remove`) and `Embedder` (`embed`,
  `dimensions`) ports with `VectorItem`, `VectorHit` and `VectorQueryOptions` in `./contracts`, the in-memory
  `MemoryVectorIndexDriver` (cosine similarity) in `.`, and `PgvectorVectorIndexDriver` in `./node` over the `Database`
  port: pgvector's cosine distance on `search.vector_items`, scope-filtered under row-level security, created by the new
  migration `search.0002_create_vector_items`. No `Embedder` driver ships here; provider drivers belong to the AI
  integrations.
- 02a7917: Fuse the vector lane into search (ADR 0221 d1, stackra-301). `SearchRequest.vector` (`SearchVector`) carries a query
  embedding to a driver that sets `SearchDriver.fusesVectors`; `PostgresSearchDriver` ranks it as a third reciprocal-rank
  lane over `search.vector_items` under the same filters and visibility, or alone. `SearchIndex.find`/`page` take an
  `embedder` for a hybrid read of a `semantic: true` model, and `SearchIndex.similar(phrase, { embedder })` is the
  semantic read. `SemanticChangeService` now chunks long text (`search.embedder.passageCharacters`/`passageOverlap`),
  stores `row` and a content `hash` in each passage's metadata and skips re-embedding an unchanged passage through the
  new `VectorIndex.metadataOf` (default: none known). `passageIdsOf` lists every chunk id; `SearchForgetService` removes
  them all. `SemanticChangeService` takes `SearchConfig` as a fourth constructor parameter.
- fdf4b94: Versioned index swap (ADR 0221 d7, stackra-303). `SearchTable.version` addresses an index version; `SearchDriver`
  gains `prepare(table, version)` and `swap(table, version)` (the default refuses). `MemorySearchDriver` keeps a shadow
  per table, writes it beside the live index and swaps it in at once. `PostgresSearchDriver` writes and clears the
  `__v<n>` shadow columns beside the live ones, writes one version alone for a rebuild, reads the live columns only, and
  leaves the swap to the contract migration. `t.searchable({ ..., version })` writes the shadow columns (the expand
  step). `SearchIndex.prepare`, `swap` and `reindex({ version })`; `reindexSearch(..., { version })` runs a versioned
  rebuild and swap (queued as `data_maintenance.index.reindex` with `ReindexSearchInput.version` of
  `@stackra/data-maintenance`); migration `search.0006_add_search_index_version` and `SearchIndexStatus.version` record it.
- 3671963: Apply record visibility before ranking (`SearchRequest.visible`, ANDed into both Postgres lanes), match Arabizi words
  by their Arabic spelling (`SearchRequest.alternatives`), add `SearchIndex.snippets` that never excerpts a `no_snippet`
  (privileged) field outside the record's team, `Search.across` for a global search over several models, and
  `HttpEmbedderDriver` for an in-region OpenAI-compatible embeddings endpoint (`search.embedder`).
- 640ae17: Export `searchWordsOf` and `arabiziOf` from `.`, so callers fold search text exactly as the index does. `find`, `page`,
  `facets` and `across` take `arabizi: false` to drop the Arabizi spelling for one read. `Search.across` takes
  `SearchAcrossOptions`: per-model `filters` (a `Map` from model class to filters), `locale` and `arabizi`.
  `PgvectorVectorIndexDriver` now takes `SearchConfig` and works at the fixed `search.embedder.dimensions`: it refuses
  vectors of other sizes and queries `"embedding"::vector(n)` among the rows of that dimension, which migration
  `search.0004_create_vector_hnsw_index` indexes with HNSW by cosine distance for the default 1024 (STA-1251).

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
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
- 38bebd1: `stackra search:reindex` and `search:status` connect with `directDatabaseUrl()` of `@stackra/database/node`
  (`DATABASE_DIRECT_URL`, else `DATABASE_URL`) instead of reading `DATABASE_URL`, so they run past the pooling proxy
  (ADR 0473, STA-1409).
- 20f3fe9: Docs: `VectorIndex` (`search.vector_items`) is the platform's one vector store (ADR 0465); `@stackra/ai` dropped its
  own `ai.embeddings` table.
- be97996: `SearchSettings` names its ranking rules `rankingRules` (`search.rankingRules`), since `rules` is the settings base's
  cross-field rules method; the package declares its `@stackra/actions` dependency; the generated search query's
  `arabizi` input is a plain boolean field and its output schema lives in its own constant.
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
- Updated dependencies [0abe92d]
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
- Updated dependencies [94ae85f]
- Updated dependencies [dddbbcd]
- Updated dependencies [856995c]
- Updated dependencies [e7ee0a4]
- Updated dependencies [ca85d59]
- Updated dependencies [d72a734]
- Updated dependencies [9841d79]
- Updated dependencies [f6d1a76]
- Updated dependencies [c196bc6]
- Updated dependencies [49ab0e6]
- Updated dependencies [d156aa8]
- Updated dependencies [6d46e5e]
- Updated dependencies [2787c1e]
- Updated dependencies [38a5501]
- Updated dependencies [e0f2fc8]
- Updated dependencies [62c7ae1]
- Updated dependencies [c868bad]
- Updated dependencies [0d36f0d]
- Updated dependencies [a701ccb]
- Updated dependencies [a526605]
- Updated dependencies [da8bdbd]
- Updated dependencies [763e901]
- Updated dependencies [936fcb1]
- Updated dependencies [f11cbe8]
- Updated dependencies [f7a2d36]
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [483eb44]
- Updated dependencies [fb93026]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [3a9eb7e]
- Updated dependencies [cc8db5e]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [e1dde33]
- Updated dependencies [6d04650]
- Updated dependencies [2787c1e]
- Updated dependencies [d9d5187]
- Updated dependencies [fd1a986]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [d5e5ff8]
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
- Updated dependencies [09080ac]
- Updated dependencies [0a20a9f]
- Updated dependencies [2787c1e]
- Updated dependencies [3d34a5d]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [a31d463]
- Updated dependencies [158f6cf]
- Updated dependencies [62a97c0]
- Updated dependencies [56dde43]
- Updated dependencies [786f390]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [69363bf]
- Updated dependencies [9759078]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [2c0ea71]
- Updated dependencies [ab9cc36]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/outbox@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/settings@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

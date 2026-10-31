# @stackra/infra-gcp

## 0.2.0

### Patch Changes

- Updated dependencies [9085c41]
- Updated dependencies [3e4c408]
- Updated dependencies [a4b8844]
- Updated dependencies [d37c08f]
  - @stackra/contracts@0.2.0
  - @stackra/runway@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 769adee: Grant Encore Cloud least-privilege roles on GCP (ADR 0435): when an environment's `destinations.services` is
  `encore-cloud` and `providers.gcp.encore.serviceAccount` is set, `gcpBaselineConfig` carries `encore` and `gcpBaseline`
  binds that service account to each of `ENCORE_ROLES` on the project instead of `roles/owner`. A principal that is not a
  service account email is refused.
- bb23b48: Add `@stackra/infra-gcp`, the free GCP foundation as Pulumi programs read from the root runway (ADR 0354): per
  environment `gcpBaseline` (a provider pinned to the project and region with cost labels, a rotating Cloud KMS key, the
  files bucket with uniform access, the media CORS rule and expiry rules, the GitHub Workload Identity infra service
  account and, once per project, a billing budget notifying a Pub/Sub topic), the config reader `gcpBaselineConfig`,
  `resolveRef`, and `./testing` with `mockPulumi` and `outputOf`. Region, projects, billing account, currency and
  amounts are runway data.
- 47cf8c8: Switch pgaudit on for every Cloud SQL server unless the runway says `shared.database.pgaudit: false` (ADR 0212
  decision 5): the `cloudsql.enable_pgaudit` and `pgaudit.log` flags (`ddl,role` by default) and a sink routing the
  server's pgaudit entries into a log bucket in its region, kept 400 days by default. `GcpRuntimeConfig.database` gains
  `pgaudit`.
- 5d15b20: Read each deployment's project from the runway `cloud` (replacing `providers.gcp.environments`) and its region from its
  GCP regions, support dedicated tenants, add the billing-detach spend stop at `budgets.stopNonProdAt`, the `gcpRuntime`
  stack with Cloud SQL backups kept in the region and point-in-time recovery, deploy roles narrower than `roles/owner`,
  the service account id guard while the runway is read, and the `GcpHealthIndicatorDriver` (ADR 0400, ADR 0401).
- 1a4efc2: Provision the shared cache on GCP and Cloudflare. `gcpRuntimeConfig` reads `shared.cache` (`engine: valkey`, node
  type, shards, replicas, eviction, `auth`, `subnet`) and `gcpRuntime` creates a Memorystore for Valkey instance on the
  deployment's VPC over Private Service Connect, encrypted in transit, with IAM sign-in unless `auth: none`, and the
  VPC's `gcp-memorystore` connection policy when `subnet` is named; it exports `cacheInstance` and `cacheEndpoint`.
  `GcpRuntimeConfig` gains `cache` and `GcpRuntimeOutputs` gains `cacheInstance` and `cacheEndpoint`. In
  `@stackra/infra-cloudflare`, `workersCacheNamespaces(root)` names the Workers KV namespace of each environment whose
  default cache driver is `workers`, and `cloudflareCoreStack` declares them and returns them as `caches`.
- 3d0354e: Query telemetry, the N+1 guard, batched link loading and a request memo (stackra-282). `@stackra/database` counts every
  statement through one ORM logger (normalised shapes, no values), hands a `QuerySample` to the new `QueryObserver`
  observers (`DatabaseOptions.observers`; `LoggerQueryObserverDriver` logs `database.slow_query`), ships
  `DatabaseQueryBudgetDriver` for the new actions `QueryBudget` port, `DatabaseConfig.queries` (slow, repeats, strict),
  `strictLoading` in `./testing`, `Extension.PgStatStatements` (ADR 0160 note) and batched `GraphQuery` relations.
  `@stackra/actions` adds the `queryBudget` option and `ctx.memo`. `@stackra/model` adds `Link.loadMany` and
  `Link.useBatchResolver`. `@stackra/infra-gcp` sets `log_min_duration_statement` and `auto_explain` from
  `shared.database.slowQueryMs` (1000 ms by default, `false` turns it off).
- 37e1aa8: Round D. search: synonym sets per index and language as settings data (`search.synonyms`), applied by both Postgres
  lanes; `find`/`page`/`facets` take `locale`. events: `IntegrationEvent({ crossRegion: true })`, the `RegionBus` port,
  `crossRegionRecords` and `RegionBusFake`. infra-gcp: static egress addresses (`shared.network.egress.staticIps`).
  versioning: deprecated dated versions are served until their support window ends (`VERSION_SUPPORT_MONTHS`), then
  refused; `applyVersionHeaders`. infra-tools:
  OCR and Photon images, tool databases and Valkey, Infisical secret sync, EBS-backed tools.

### Patch Changes

- 697fe4b: Refuse database backups kept past 35 days unless the runway states `shared.database.backups.cryptoShredded: true`
  (ADR 0188 decision 3), so a backup never outlives an erasure.
- 04133f8: The files bucket follows `filesystem.disk` only: a runway `media.disk` is no longer read (ADR 0465 folded `MediaDisk`
  into `FileSystem`, so media stores through the file disk). A root runway that put only `media.disk` on `s3` now needs
  `filesystem.disk: s3` to keep its files bucket.
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
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [62c7ae1]
- Updated dependencies [37e1aa8]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [a1eb70f]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [3ccd0ab]
- Updated dependencies [769adee]
- Updated dependencies [4135a5a]
- Updated dependencies [c927e35]
- Updated dependencies [29c2d3e]
- Updated dependencies [2787c1e]
- Updated dependencies [8d304d6]
- Updated dependencies [e344058]
- Updated dependencies [a183131]
- Updated dependencies [fbf8fa4]
- Updated dependencies [4ea8dd0]
- Updated dependencies [3a5d71d]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
- Updated dependencies [d19a3d5]
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/runway@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

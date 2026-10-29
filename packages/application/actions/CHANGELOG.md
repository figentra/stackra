# @stackra/actions

## 0.1.0

### Minor Changes

- f7fb4ad: Restore pipelines that bind no `ApprovalGate`: the approval step runs only when a gate is bound, and only an action
  that declares `approval: true` fails closed without one (STA-813, ADR 0397 as amended); the testing pipeline no longer
  injects an open gate. Add step-up assurance: `CallOptions.assurance` and `ctx.assurance` (`amr`, `authTime`, `level`),
  the `AssuranceLevel` enum, the `StepUpCheck` port and the action option `stepUp`, checked right after the permission
  and failing closed without a driver (STA-814, ADR 0406). Add the `toHaveAudited` matcher and `RunResult.audit` to
  `./testing` (STA-820). Add `postgres` to the store driver names so runway selects @stackra/database's Postgres
  idempotency and rate-limit stores (STA-756).
- e7a388a: Add the dev-only `./devtools` entry: `defineActionsDevtools(kit)` defines the `actions.registry` devtools tab, each
  registered action and query with its key, kind, class, permission, risk, effects and input class (stackra-208, ADR
  0246, ADR 0461).
- 68dd2a5: Add the approval step (`ApprovalGate`, `approval_required` with `CallOptions.approvalId`), the `Effect` tags with
  `bulk` on `ActionRegistration` and `CallDescriptor`, `structural` actions guarded by `LiveConfigurationGuard`
  (`live_read_only`), `meter` with the `UsageRecorded` event written in the unit of work, the `OutboxAuditTrailDriver`
  with `AuditEntryRecorded`, the offline cap's `amountField`, and the Valkey idempotency and rate-limit stores with
  `StoresConfig`.
- e0f2fc8: Add the `memory` AccessControl driver to `@stackra/actions/testing`: it allows every permission unless a test denies one
  with `denyPermission(name)`, so a testing module on memory drivers binds AccessControl.
- 2787c1e: Add `@stackra/actions`, actions and queries of the programming model v3.1: the called-only kind bases
  `Action({ key, actors, ... })` and `Query({ key, actors, ... })` with their surfaces (`endpoint`, `tool`, `intent`,
  `job`, `offline`, `cache`), the bare `Precondition`, `ExtensionPoint` (with `after` and `before` slots) and
  `Interceptor`, and `Extension<Point["slot"]>` in both forms; the enums `Idempotency`, `OfflineMode`, `IdMinting`,
  `OfflinePrecondition`, `ConflictResolution` and `PipelineStage`; `ActionPipeline`, which runs tenancy, permission
  (failing closed), preconditions, entitlement, flag, validation and idempotency, rate limit, interceptors and `handle`
  in its unit of work, then the after-commit work and the audit entry, with the call's `scope` (a `ScopeRef`) on
  `CallOptions`, `CallDescriptor` and the context; `ctx.period` over every panel range including `yesterday` and
  `custom`; the `job.cron.perScope` switch; `RequestContext`; `RateLimitConfig` with
  `RateLimitConfig$`; the memory idempotency and rate-limit stores; `registerActions`, `registerExtensions` and
  `connectExtensions`; `./contracts` with the step and store ports; `./node` with the `AsyncLocalStorage` context
  driver; and `./testing` with `run`, `fakeActionContext`, `fakeExtensionContext`, `extension` and the testing-module
  plugin that adds `.withExtensions`.
  
  For offline clients (ADR 0338, 0337): a device's replayed calls run in the order of their per-device sequence
  (`CallOptions.device`, set by the generated adapter from `@stackra/clients`' `DEVICE_ORDER` headers), a refusal settles
  its sequence, and a resend replays or is refused `device_sequence_out_of_order`; `offline.cap` is reconciled per device
  and refused with `offline_cap_reached`; a `replica:` query answers `ctx.replica(fill, slice)` in the client's
  `ReplicaChanges` shape from `ReplicaFeed`'s change log; an `accepts: { ruleVersion, evaluator }` action records a
  review item when the server's figure differs or the rule version is older, and never refuses the sale. The four new
  ports (`DeviceSequenceStore`, `OfflineCapStore`, `ReplicaLog`, `ReviewItemSink`) ship with memory drivers.
- df3f38b: Declare action effect tags with `effects` (`ActionEffects`, snake_case `Effect` codes); make the runtime `tool`
  default match gen (an action a user can perform is a tool unless `tool: false`); add the `LimitReservation` port that
  wraps an action's unit of work (reserve, then commit); write a successful call's audit entry inside the unit of work;
  fail closed when no `ApprovalGate` is bound (bind `OpenApprovalGateDriver` for an app with no approvals); add
  `ActionPipeline.propose` (a metered draft with no effects) and the approver rule check `approverRefusal`.
- 4413118: Add the request origin: `CallOptions.origin` (`CallOrigin` with a `CallOriginKind` of `storefront`, `console`,
  `api_key` or `agent`, from `./contracts`), which the pipeline carries to the call descriptor, the audit entry and
  `ctx.origin`; `AuditEntryRecorded` gains optional `originKind` and `originId`. Add `ctx.publish(event)`, which writes an integration event no model owns through the `EventOutbox` in the
  action's unit of work. Add `ReplicaChange.cascade`: a change stamped above a reader's scope node reaches it on an
  incremental refresh (a lot recall), and the memory replica log honours it. `fakeActionContext` records published events.
- a6ec591: Add the sandbox flag (`CallOptions.sandbox`, `CallDescriptor.sandbox`, `ctx.sandbox`) and the network client
  (`CallOptions.client`, `ctx.client`, the `CallClient` type) to the call, a raw-body query output (`rawBody`,
  `isRawBody`, `RawBody`), and let `toHaveAudited` assert the fields a `fakeActionContext()` passed to `ctx.audit`
  (STA-1248).
- 38fb3e2: Run every action, query and proposal in one `Tracer` span when a tracer is bound: named `<kind> <key>`, with the ADR
  0147 attribute names (`action`, `correlationId`, `actorType`, `actorId`, `scopeId`, `origin`, `outcome`, `code`,
  `latencyMs`) and no input or output values. A refusal is an outcome, not a failed span (stackra-411, STA-1513).
- 99665bb: Server-side consent (ADR 0472). `@stackra/consent` adds the signed, short-lived `ConsentSnapshot`:
  `ConsentLedger.snapshotRequest` (what the client sends), `ConsentSnapshotIssuer` (re-applies the rules and signs
  through the `Signer` port), `ConsentSnapshotVerifier` (key, signature, lifetime, policy version, Global Privacy
  Control), the `ConsentSnapshotKeys` port with `signer` and `static` drivers, `SnapshotConsentCheckDriver`, the
  `CONSENT_SNAPSHOT_HEADER` (`Stackra-Consent`) and the `snapshotLifetimeMinutes` and `snapshotClockSkewSeconds`
  settings. `@stackra/actions` adds `CallOptions.consentSnapshot`, `ctx.consent()` verified once per call through the new
  `ConsentCheck` port (`CallConsent`, `ConsentRefusal`), refused without a snapshot or a bound check and never refusing
  the call, and the `grantedConsent` test helper.
- 8ead1a8: The consent snapshot travels (ADR 0472). `@stackra/actions` adds `requestCallOptions(request)`, which a generated
  endpoint spreads beside the verified actor to lift `Idempotency-Key` onto `idempotencyKey` and `Stackra-Consent` onto
  `consentSnapshot`, as sent, and `CALL_HEADERS` (`./contracts`) naming both. `@stackra/consent` adds the consent
  endpoint in a new `./node` entry: `IssueConsentSnapshotAction` (`POST /consent/snapshots`,
  `consent.consent_snapshot.issue@1`, public, for anonymous visitors and users) with its input and output and
  `ConsentSnapshotPermissions.issue` (L0); `CONSENT_SNAPSHOT_PATH`; and the client half, `consentSnapshotHeaders`, which
  fetches a snapshot of `ledger.snapshotRequest()`, refreshes it when the decision changes or nears expiry, and answers
  the `Stackra-Consent` header for a session's `headers()`. `CONSENT_SNAPSHOT_HEADER` is now `CALL_HEADERS.consentSnapshot`.
- e7ee0a4: Raise database errors as refusals at the action boundary: `translateDbError` maps an optimistic-lock failure to
  `StaleVersionError` (409), a unique violation to `DuplicateRecordError` (409), foreign-key, check and not-null
  violations to `ConstraintViolatedError` (400) and deadlocks, serialization failures and timeouts to the retryable
  `TransactionConflictError`. `CrudService.update` takes `expectedVersion`, and `CallOptions.expectedVersion` (from
  If-Match) reaches handlers as `ctx.expectedVersion`.
- a701ccb: Add runtime database timeouts: `DatabaseConfig.timeouts` (statement, lock, idle in transaction) passed to `connect` as
  `DatabaseOptions.timeouts` and set on every primary and replica session, `TransactionOptions.timeout` as a
  transaction-local statement timeout, and an action's `timeout` option that the pipeline hands to
  `UnitOfWork.transaction(work, { timeout })`.
- a681685: `AssuranceLevel` and `MeterKind` have one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/actions/contracts`
  and `@stackra/identity` no longer export `AssuranceLevel`, and `@stackra/actions` and `@stackra/model` no longer export
  `MeterKind`; import both from `@stackra/contracts`. The codes are unchanged.
- 0e7eb1f: Serve a query's `cache` option on the server (ADR 0305 rule 31 as amended, STA-1445). `@stackra/actions` adds the
  `cache` step to `PipelineStage` (inside the interceptors, before `handle`): with a `Cache` from `@stackra/cache` bound,
  a query that declares `cache: { ttl, per?, invalidateOn? }` answers from its entry or runs `handle` once and stores
  the answer. `CacheScope` (`Principal`, the default; `Scope`; `Site`) says whom one entry is shared with, and the key
  carries the tenant, that holder and a fingerprint of the input and the request facts. `registerCachedQueries` and
  `QueryCacheEvictorListener` forget a query's entries in the event's tenant after an `invalidateOn` event commits, and
  `expectScopeCacheSafe` (`./testing`) proves a scope-wide query answers every caller the same. `@stackra/actions` now
  depends on `@stackra/cache`.
  
  `@stackra/gen` refuses `site_cache_reads_caller` (a site-cached query that reads its caller), registers the cached
  queries with `registerCachedQueries`, binds the evictor in a service that declares `@stackra/cache`, and wires each
  live query's refresh (`liveQueryRoutes`) in the boot of a service that runs `@stackra/realtime`. `emitBoot` takes the
  manifest as a second argument.
- 3d0354e: Query telemetry, the N+1 guard, batched link loading and a request memo (stackra-282). `@stackra/database` counts every
  statement through one ORM logger (normalised shapes, no values), hands a `QuerySample` to the new `QueryObserver`
  observers (`DatabaseOptions.observers`; `LoggerQueryObserverDriver` logs `database.slow_query`), ships
  `DatabaseQueryBudgetDriver` for the new actions `QueryBudget` port, `DatabaseConfig.queries` (slow, repeats, strict),
  `strictLoading` in `./testing`, `Extension.PgStatStatements` (ADR 0160 note) and batched `GraphQuery` relations.
  `@stackra/actions` adds the `queryBudget` option and `ctx.memo`. `@stackra/model` adds `Link.loadMany` and
  `Link.useBatchResolver`. `@stackra/infra-gcp` sets `log_min_duration_statement` and `auto_explain` from
  `shared.database.slowQueryMs` (1000 ms by default, `false` turns it off).
- 3b19f6d: Rate limits as ADR 0217 decision 2 promises (STA-1477). `RateLimitedError` carries the refusing bucket's
  `retryAfterMs`, `limit` and `remaining`, and the new `rateLimitHeaders` turns them into `Retry-After` and
  `RateLimit-*`. The pipeline keys the area bucket by (app, scope), passes the bucket's numbers on the refusal and, with
  an outbox bound, writes one `actions.rate_limited` usage event per refusal. `EntitlementRateLimitBudgetDriver` sizes
  the area bucket from the plan's `rate_limit.<area>_per_minute` and `rate_limit.<area>_burst` value entitlements. The
  generated HTTP adapter answers a rate-limited refusal with 429, its envelope and the headers.
- b163445: Add `Query({ reads: "replica" })`: the pipeline runs the query's `handle` on a read replica through the new
  `ReplicaReads` port, except inside the caller's read-your-writes window after its own committed action (recorded per
  instance, or carried by the transport as `CallOptions.lastWriteAt`). `@stackra/database` ships
  `DatabaseReplicaReadsDriver` over `Database.onReplica` and `DatabaseConfig.readYourWrites` (5 seconds by default)
  (stackra-402, STA-1504).
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- 62a97c0: Add server analytics: `Action({ analytics })` and `Query({ analytics })` take `true` (the generic `action.called` event
  with key, outcome, duration and origin) or an `AnalyticsEvent` class (its declared fields from the output, then the
  input). The pipeline writes `AnalyticsTracked` (`analytics.tracked.v1`) through the outbox, in the unit of work for a
  successful action, only when the call's verified consent grants `analytics`. The new `@stackra/analytics/node` entry
  ships `RelayTrackedAnalyticsListener`, which sends each event to the bound `AnalyticsDriver` (stackra-410, STA-1512).

### Patch Changes

- f81699d: Type `AnalyticsTracked.properties` as `Record<string, Json>`, so gen compiles the event's shape (`unknown` is not a
  shape type).
- bc4acfc: `Cache` gains tags and `forgetTag(tag)` (`put` and `remember` take `{ tags }`), stale-while-revalidate
  (`remember(..., { stale })`), one fill across instances (`remember(..., { lock: true })` over the new `CacheLock` port)
  and lifetime jitter (`cache.jitter`), plus the `CacheMetrics` port with the `none`, `counting` and `logger` drivers
  (`cache.metrics`). Every driver now runs one shared `storedCache` over an entry store; the Valkey driver indexes keys
  and tags in sorted sets, so `forget` no longer walks `SCAN` and no command touches two keys. New config fields `lock`,
  `metrics`, `jitter` and `fill` (`wait`, `poll`). The driver constructors take the `CacheMetrics` port (and the Valkey and
  Workers drivers the `CacheLock` port). `@stackra/locking` ships `LocksCacheLockDriver` (`cache.lock: locks`) and now
  depends on `@stackra/cache`. `@stackra/actions`' test fakes implement `forgetTag` (STA-1435).
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
- a3d23d9: Rule-gap B-7 (stackra-234): `typescript/explicit-module-boundary-types` at error for packages; apps, workers, tools,
  build scripts, tests, stories and e2e specs are off.
  
  The other packages: no behaviour change. Exported functions and public class members now spell the return type they
  already had: components return `ReactElement` (or `ReactElement | null`), panel overrides their base's node type,
  Pulumi helpers an object type of their resources, and zod factories their schema type. `tableInput` keeps its inferred
  schema type with a reasoned disable.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 8c7a376: One public-id minter (STA-1380, ADR 0135). `@stackra/contracts` exports `mintPublicId(prefix, time?)`: the prefix and
  the lowercase Crockford base32 of a UUIDv7, in minting order within one process (also within one millisecond and when
  the clock steps back). `@stackra/model`'s `HasPublicId`, `@stackra/actions`' audit and usage events and
  `@stackra/outbox`'s writer all mint with it, so every `evt_` id has one form. The internal minters of actions (random
  lowercase), outbox (uppercase ULID) and model are removed. Ids already stored in the older forms keep working: the
  outbox's `evt_` check and the inbox's claim compare ids as strings.
- 150fa18: `JobOptions.backoff` is typed as the contracts `Backoff` instead of `string`. (stackra-223)
- 47554e7: `SHARED_CACHE_CONTEXT` has one home: `@stackra/actions` exports it from its `.` entry, and `@stackra/database`'s entity
  cache and cache invalidation import it from there instead of declaring their own copy.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [0abe92d]
- Updated dependencies [c547718]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [4502f57]
- Updated dependencies [bc4acfc]
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
- Updated dependencies [483eb44]
- Updated dependencies [acff14a]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
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
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [376a093]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [e344058]
- Updated dependencies [2787c1e]
- Updated dependencies [a65c6bc]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/events@0.1.0
  - @stackra/cache@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

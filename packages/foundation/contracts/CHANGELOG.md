# @stackra/contracts

## 0.33.0

### Minor Changes

- 93d63bb: Tenancy ships the per-tenant `KeyProvider` (ADR 0188 decision 2, amendment 2026-11-09). `TenantKeysConfig` (`tenancy.tenant_keys`) picks the driver: `ephemeral` (the default, random keys per tenant in memory, for dev and tests) or `kms`, which keeps each tenant's data keys wrapped by a regional AWS KMS key under the encryption context of tenant and key id, mints `k1` on a tenant's first seal, rotates to `k<n+1>` and never retires an old key, so data sealed earlier still opens. The wrapped keys live behind the new `TenantDataKeyStore` port: `memory`, or `postgres` in the append-only, tenant-owned `tenancy.tenant_data_keys` (row-level security on `tenant_id`), and each mint records `TenantDataKeyMinted`. Both drivers refuse a platform call: a tenant data key needs `withTenant`. Unwrapped keys are cached per tenant (`cacheSeconds`, `cacheTenants`). Contracts gives `KeyProvider` its driver key and exports `kmsKeyContext`.

### Patch Changes

- 93d63bb: `SignerConfig` has a `driver` field that picks the `Signer` driver: `ephemeral` by default, or `kms`. Before, no config field selected one, so a member that injected `Signer` (os audit) failed to boot with `UnresolvedPortError: ... its drivers are ephemeral, kms, and no config field selects one`, in production too.
  
  Production sets `driver: kms` with `kmsKeyId` in its runway values. `Signer` also declares its type-only port key (`contracts.Signer`), so `DriverName<Signer>` narrows to these two names.
  
  `SecretsConfig` is new: keyed `secrets` in this package, and exported with `SecretsConfig$` and `SecretsOptions`. Its `store` field picks the `SecretStore` driver: `memory` by default, or `aws_secrets_manager`. Nothing selected one before, and no runway environment sets one today, so `memory` keeps today's boots. A deployment that reads AWS Secrets Manager sets `store: aws_secrets_manager` in its runway values.

## 0.32.0

No changes in this release.

## 0.31.0

No changes in this release.

## 0.30.0

### Minor Changes

- 17fafdd: A ninth actor kind, `ActorKind.ApiClient` (`api_client`): a tenant's server calling with an API key. An action or query
  declares `public: true` or `public: { scopes, publishable }` to answer one; every other operation refuses it, and so
  does a call without a key. `CallOptions.credential` carries the verified key (id, scopes, publishable, version pin) onto
  the descriptor with `descriptor.public` (the required scopes and whether only exact keys count: L3 and above, approval
  or step-up). iam's `AccessControl` checks an `api_client` call's scopes (`keyCovers`: exact keys, or selectors below
  L3); a publishable key calls a public write only when it opts in.
- 4ce80a2: An anonymous call acts in the tenant the edge Worker signed (`EdgeHeader.Scope`, ADR 0437): `EdgeHeaderGuard` records
  the scope once the signature and the request id verify, and `serveGuardedCall` gives it to the anonymous actor as its
  `scopeId`, its visitor id kept. A credential's tenant wins; a token or an API key whose tenant differs from the signed
  one is refused with the generic 403; no signed scope means no tenant. A signed scope that is not an `scp_` public id
  is refused (fail closed). `@stackra/contracts` adds `isPublicId(value, prefix)`, a type guard for a string in public id
  form.
- 8c17109: Two new ports, `IdempotencyRetentionSource` (how long an Idempotency-Key is kept) and `VersionSupportSource` (how many
  months an API version stays supported), so an operator's settings can set both without `@stackra/actions` or
  `@stackra/versioning` depending on `@stackra/settings`.
- ef49e63: The rate-limit step can read a scope's limits from settings, so an operator lowers them without a deploy. When a
  `RateLimitCapSource` (new port in `@stackra/contracts`) is bound, each area bucket number and each default action
  bucket is the lower of its own and the scope's cap; a cap never raises a limit, and a failed read fails the call.
  `@stackra/settings` ships the driver, `SettingsRateLimitCapSourceDriver`, over the new `RateLimitSettings` group
  (`rate_limit.<area>PerMinute`, `<area>Burst`, `actionPerScope`, `actionPerAddress`; `null` caps nothing). With no
  source bound, nothing changes.

## 0.29.0

No changes in this release.

## 0.28.0

No changes in this release.

## 0.27.0

No changes in this release.

## 0.26.0

No changes in this release.

## 0.25.0

No changes in this release.

## 0.24.0

No changes in this release.

## 0.23.0

No changes in this release.

## 0.22.0

No changes in this release.

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
- f184d12: A service can now call for a user (ADR 0209, amendment of 2026-11-07). The calling service sends its own token as
  `Authorization: Bearer` and the user's own access token in `Stackra-On-Behalf-Of`. `CallAuthenticator` verifies both
  with the same issuer, audience and leeway, and the call becomes the service acting for that user:
  `{ kind: "service", id: "svc_…", scopeId?, onBehalfOf: <the user> }`. The forwarded token itself is never kept; only
  the user it names travels. A forward is refused when it sits beside a user token or no token, when it has expired or
  names another audience, when it is a service's token, or when the service is bound to a tenant other than the user's.
  
  The call then runs in the user's tenant: `actingScopeId` gives a service with no tenant of its own the tenant of the
  user it calls for, as it already did for an agent. `CallIsolationDriver` treats a service like an agent: it refuses
  one whose own tenant differs from its user's, and one with a tenant whose scope sits above every tenant or is not in
  the scope tree (`tenant_scope_mismatch`). A service with no tenant and no user stays a platform call, as before.

## 0.20.0

No changes in this release.

## 0.19.0

### Minor Changes

- bac874e: The last Infisical uses in the developer packages move to sops and figentra/secrets (ADR 0525).
  
  - `stackra mcp exec -- <argv>` decrypts each `$NAME` the command names with `sops exec-env` from the `agents` scope of
    the local figentra/secrets clone (`$STACKRA_SECRETS_DIR`, default `~/.stackra/secrets`), one nested call per secret,
    instead of `infisical run`. Its `--env` and `--path` flags are gone; `McpExecOptions` is now `{ secretsDir? }`.
  - Mobile onboarding no longer writes the FCM key to a vault: it goes only to EAS, its one reader, and running the
    `push` step again replaces a lost key. `InfisicalVaultWriterDriver` is removed, and `MobileOnboardRequest` has no
    `vault` port. A missing root-kit name prints `pnpm secrets:put <NAME> --scope ci/production/store` as its owner step.
  - gen's `env` manifest rows no longer carry `home` (the Infisical folder `/runtime/<member>`), and the field is gone
    from the `StackraManifest` type; runway already ignored it. Products regenerate their manifests after the release.
  - `stackra dev --tunnel` names the sops way to start with `CLOUDFLARE_TUNNEL_TOKEN`, and the service template's
    `runway.yaml` header names figentra/secrets.

### Patch Changes

- 58e3066: `actingScopeId(actor)` and `claimedScopeIds(actor)` move to `@stackra/contracts`: the one answer to which tenant a call acts
  in (an agent's own `scopeId`, else the tenant of the human it acts for; any other actor's own `scopeId`). Every place
  that read `actor.scopeId` as the call's tenant now reads it: the pipeline's `CallDescriptor.scopeId` and `ctx.scopeId`
  (so rate limits, meters, idempotency, query cache keys, approvals and audit entries follow), the queue's job actor and
  unique key, IAM's node lookup, the automation principal check, the access-log outbox sink's `scopeId` stamp, and
  `PostgresAuditTrailDriver`, which now records an agent with no tenant of its own in its human's tenant instead of
  skipping it. A platform agent and every other actor kind are unchanged.

## 0.18.1

No changes in this release.

## 0.18.0

No changes in this release.

## 0.17.2

No changes in this release.

## 0.17.1

No changes in this release.

## 0.17.0

No changes in this release.

## 0.16.0

No changes in this release.

## 0.15.0

No changes in this release.

## 0.14.4

No changes in this release.

## 0.14.3

No changes in this release.

## 0.14.2

No changes in this release.

## 0.14.1

No changes in this release.

## 0.14.0

No changes in this release.

## 0.13.0

No changes in this release.

## 0.12.0

No changes in this release.

## 0.11.1

No changes in this release.

## 0.11.0

No changes in this release.

## 0.10.0

### Minor Changes

- e57b9a1: `stackra gen` writes an `env` section into `stackra.manifest.json` (ADR 0173 amendment 2026-11-04, STA-2104): one
  row per environment name the member's configuration classes declare (`Config({ env })` names and `@Secret` fields),
  with its kind (`secret`, `public`, `config`), type, rules, refused prefixes and environments; a service adds its
  hosted packages' rows, an app only their public rows, and each gets the Infisical path `/runtime/<member>`. `@Secret` takes an optional second
  argument, `{ refuse, environments }`, read by gen. `StackraManifest` types the section.

## 0.9.0

### Minor Changes

- 2e43c48: `StackraManifest` gains an optional `relay` section: a producer's public keys and the consumers it delivers to, per
  environment (ADR 0511, amendment of 2026-11-02, STA-1910). Gen writes it for a service that delivers events to another
  app; a consumer's inbox verifies deliveries with those keys.

## 0.8.0

No changes in this release.

## 0.7.1

No changes in this release.

## 0.7.0

No changes in this release.

## 0.6.1

No changes in this release.

## 0.6.0

No changes in this release.

## 0.5.1

No changes in this release.

## 0.5.0

No changes in this release.

## 0.4.0

### Minor Changes

- 9c8d108: Packages contribute console commands, and gen collects them per member (STA-1731). `@stackra/console` audits a
  command declared `audit: true` through the `CommandAudit` port (refused before it runs when no sink is ready; secret
  values redacted). gen records commands in the manifest, merges hosted packages' commands, refuses
  `command_collision`, and writes `#stackra/commands` and a console entry that `stackra console <member>` runs. First
  commands: `db:migrate`, `db:rollback`, `db:status`, `db:seed`, `tenant:list`, `tenant:create` (with a
  `TenantDirectory` port), `cache:clear` (the `Cache` port gains `flush`), `queue:work`, `queue:failed` and
  `queue:retry`; `@stackra/access-log` stores command audit entries (`STACKRA_COMMAND_AUDIT_SCOPE`).
- f8fe5a5: Add `actorChainOverlaps(a, b)`, the one `onBehalfOf` chain check, and `actorsSharePerson(identity, a, b)`, which also
  treats two `usr_` ids of one human as one person (STA-1724, ADR 0509). `IdentityResolver` gains `personOf(usr)`, a
  non-abstract method that answers `null` until identity ships a person link; `actorsSharePerson` then falls back to a
  verified email or phone match, and lets an identity rejection propagate so callers refuse the vote.
  
  Add `AUDIT_HOT_RETENTION`, ADR 0212's thirteen months of hot audit retention as `Duration.days(397)` (the longest any thirteen
  consecutive calendar months can run), which the approval binding prune reads.
  
  Add the `ApprovalSettingsSource` port, the one settings read behind an approval condition's limited reader; `@stackra/settings` ships its driver.
- 1856ee0: Add `Risk` (the L0 to L4 scale) and `Permission` (`Permission.L0` to `L4`, `.system()`, `.restricted()`), moved from
  `@stackra/iam` (STA-1890, ADR 0513). Both stay dependency-free, so `@stackra/contracts` is still a leaf.

## 0.3.0

### Minor Changes

- 23e556c: Adds `DataClassification.Credential` (`credential`), the class of a provider secret: an OAuth token, a client secret, an API key (STA-1677, ADR 0494).

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.

## 0.2.0

### Minor Changes

- 9085c41: OTLP for all three signals (ADR 0184 decision 1, STA-1572). `@stackra/contracts`: `Tracer` gains
  `continueTrace(carrier, work)` and `traceparent()` (implementers of `Tracer` must add both; `NoopTracerDriver` runs the
  work and names no parent), the `TraceCarrier` type, and a new `Metrics` port (counter, histogram, gauge) with
  `NoopMetricsDriver`. `@stackra/logger`: `OtlpTracerDriver` (spans to `/v1/traces`, nesting through
  `AsyncLocalStorage`, W3C trace continuation, the edge request id on every span, `traceSampleRatio` sampling) and
  `OtlpMetricsDriver` (cumulative sums, gauges and explicit-bucket histograms to `/v1/metrics` every
  `metricIntervalMs`), `parseTraceparent` and `formatTraceparent`; `OtlpConfig` adds `traceSampleRatio` and
  `metricIntervalMs`; the log reporter shares the batching sender, counts what it drops (`dropped`) and flushes on
  shutdown. `@stackra/transport`: the `traceContext(tracer)` middleware and `TRANSPORT_HEADERS.traceparent`.
  `@stackra/app`: the server `createApp` continues each request's trace (its `traceparent` and `x-figentra-request-id`,
  taken once the guards pass) when a `Tracer` is bound.

## 0.1.0

### Minor Changes

- ae3d280: Add the `HealthIndicator`, `KeyProvider` and `FieldCipher` ports with `HealthStatus`, `HealthReport` and `DataKey`
  (owner decision 23, gaps R-27 and R-36). No drivers: a KMS `KeyProvider` and a `FieldCipher` driver come with their
  consumers.
- 703b40e: Add per-tenant and per-subject keys, signing and a principal's contact facts (ADR 0414, 0415, 0416):
  `AwsKmsKeyProviderDriver` serves a tenant's data keys unwrapped through AWS KMS with the tenant and key id as the
  encryption context, `wrapScopeKey` makes a new wrapped key, and `SubjectKeyProviderDriver` derives a key per data
  subject (HKDF over the subject's salt) so erasing one person crypto-shreds only them. The new `Signer` port signs with
  ES256 through `MemorySignerDriver` or `AwsKmsSignerDriver` (the private key stays in KMS), and `verifySignature`
  checks a signature offline. `IdentityResolver.principalOf` returns the whole `VerifiedPrincipal`, which now carries the
  verified `phone` and the `timeZone` beside `locale`; implementations must add the method. No SDK dependency: the host
  passes its KMS client (`AwsKmsApi`).
- 2787c1e: Add `@stackra/contracts`, the leaf vocabulary every Stackra package builds on: the `Port` and `Enum` kind bases
  (`Enum.of`, `Enum.values`, `Enum.meta`, `Enum.Value`), `Duration` as canonical ISO 8601 strings, the enums `ActorKind`,
  `ApiArea`, `DataClassification`, `HttpMethod`, `MigrationRunner`, `Realm`, `SortDirection`, `Target` and the one `Tone`
  with ADR 0303's five values, the ports `Clock`, `Logger` and `IdentityResolver`, the types `Actor`, `PublicId`,
  `Branded`, `Email`, `Url`, `Json`, `VerifiedPrincipal` and `StackraManifest`, `brand()`, and the four
  `stackra.config.ts` helpers `defineApp`, `defineService`, `definePackage` and `defineWorker`. No workspace dependency.
- f7a2d36: Add the `PrincipalDirectory` port (`supervisorOf(principalId, scope)`, for escalation to a person's supervisor) and
  `DataClassification.Regulated` (`regulated`: identifiers a regulator issues or governs, such as a tax registration
  number or a national id). Packages that list the classification codes by hand still name four; stackra-164 aligns them.
- a656add: Add the `Tracer` port with `TraceSpan` and `TraceAttributes`, and the `AesGcmFieldCipherDriver`,
  `MemoryKeyProviderDriver` and `NoopTracerDriver`.
- 914465a: One capability-gateway check (STA-1383): `@stackra/contracts` adds `capabilityGuard<M>()`, and payments and shipping
  bind it to their maps. Breaking renames: `@stackra/payments` `hasCapability` is `hasPaymentCapability` and its
  `CapabilityGateways` is `PaymentCapabilityGateways`; `@stackra/shipping` `hasCapability` is `hasCarrierCapability` and
  its `CapabilityGateways` is `CarrierCapabilityGateways`.
- a681685: `AssuranceLevel` and `MeterKind` have one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/actions/contracts`
  and `@stackra/identity` no longer export `AssuranceLevel`, and `@stackra/actions` and `@stackra/model` no longer export
  `MeterKind`; import both from `@stackra/contracts`. The codes are unchanged.
- 187afe3: `CatalogueRow` has one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/pricing` and `@stackra/entitlements`
  no longer export their identical copies; import `CatalogueRow` from `@stackra/contracts`.
- c34bf79: `GeoPoint` has one home, `@stackra/contracts`. Breaking: `@stackra/rules/contracts`, `@stackra/shipping/contracts` and
  `@stackra/i18n/contracts` no longer export their identical copies; import `GeoPoint` from `@stackra/contracts` (STA-1383).
- 02ceb7e: One `LocalizedText`, in `@stackra/contracts` (a read-only record of strings per BCP 47 tag) (STA-1383). Breaking:
  `@stackra/experience` and `@stackra/brand-kit/contracts` no longer export their copies; import `LocalizedText` from
  `@stackra/contracts`. A brand kit's `name` and `line` are `LocalizedText & { readonly en: string }` (English still
  required).
- 8c7a376: One public-id minter (STA-1380, ADR 0135). `@stackra/contracts` exports `mintPublicId(prefix, time?)`: the prefix and
  the lowercase Crockford base32 of a UUIDv7, in minting order within one process (also within one millisecond and when
  the clock steps back). `@stackra/model`'s `HasPublicId`, `@stackra/actions`' audit and usage events and
  `@stackra/outbox`'s writer all mint with it, so every `evt_` id has one form. The internal minters of actions (random
  lowercase), outbox (uppercase ULID) and model are removed. Ids already stored in the older forms keep working: the
  outbox's `evt_` check and the inbox's claim compare ids as strings.
- 2612a7e: One rounding vocabulary (STA-1383). Breaking: `Rounding` moves from `@stackra/money` to `@stackra/contracts` (same
  four codes, same order); import it from `@stackra/contracts`. `@stackra/support`'s `QuantityRounding` stays a
  dependency-free union and is documented, and type-tested in money, as the `down`, `up` and `half_up` subset of it.
- 150fa18: Add the one retry shape and formula: `RetryPolicy` (attempts, base, max, backoff, multiplier, jitter, retryOn), the
  `Backoff`, `Jitter` and `RetryOn` enums and `backoffDelay(policy, attempt)`. `Duration.parse` also reads the short form
  (`"200ms"`, `"30s"`, `"6h"`, `"1d"`). (stackra-223)

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
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- d19a3d5: `newEventId` is `mintPublicId("evt")` (STA-1385): bus event ids now share the lowercase, time-ordered UUIDv7 form of
  action and outbox ids. Older uppercase ids stay valid, since ids compare as strings. The `PublicId` docblock now names
  `mintPublicId` as the one minter.

Written by Changesets on release; never edited by hand.

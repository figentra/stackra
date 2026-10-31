# @stackra/contracts

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

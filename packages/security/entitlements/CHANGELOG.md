# @stackra/entitlements

## 0.33.1

### Patch Changes

- Updated dependencies [e885a38]
- Updated dependencies [bf2c6ea]
- Updated dependencies [e885a38]
  - @stackra/database@0.33.1
  - @stackra/contracts@0.33.1
  - @stackra/locking@0.33.1
  - @stackra/actions@0.33.1
  - @stackra/container@0.33.1
  - @stackra/errors@0.33.1

## 0.33.0

### Minor Changes

- 4937622: Three kit blocks (ADR 0504). `@stackra/scope/react` adds `ScopePicker`: the host's scopes as a tree nested by path,
  or a search field above `searchThreshold` scopes (8 by default); choosing one sets the active scope that `useScope`
  reads. `@stackra/entitlements` gains a `./react` entry with `EntitlementGate`, which shows its children only while the
  plan grants an entitlement (asked through the container's `EntitlementSource`), its `fallback` otherwise, and nothing
  while the answer is pending. `@stackra/i18n/react` adds a headless `LocaleSwitcher` that binds @stackra/ui's
  `LocaleSwitcher` props to the nearest `I18nProvider`, remembers the choice and switches through `setLocale` or the
  host's `onChange`. Every word comes from the host.

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [93d63bb]
- Updated dependencies [ad4e5bf]
- Updated dependencies [246594d]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/actions@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/database@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/locking@0.33.0
  - @stackra/container@0.33.0

## 0.32.0

### Patch Changes

- @stackra/actions@0.32.0
  - @stackra/database@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/locking@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
  - @stackra/actions@0.31.0
  - @stackra/database@0.31.0
  - @stackra/locking@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0

## 0.30.0

### Patch Changes

- Updated dependencies [418e195]
- Updated dependencies [6005425]
- Updated dependencies [0394e56]
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [d8d78f0]
- Updated dependencies [7b5a381]
- Updated dependencies [0394e56]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [a3a3190]
- Updated dependencies [15dba8d]
  - @stackra/actions@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/database@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/container@0.30.0
  - @stackra/locking@0.30.0

## 0.29.0

### Minor Changes

- 0e8f570: Products can read real plans. `@stackra/entitlements` adds `ServicePlanSnapshotsDriver`, a `PlanSnapshots` that asks
  the plan service through the new `PlanServiceChannel` port and caches each answer for its `maxAgeSeconds`. It fails
  closed: a failed call, an answer for another scope or an undecodable grant reads as no plan and is not cached.
  `@stackra/clients` adds `TransportPlanServiceChannelDriver`, the channel over the host's `ClientTransport` calling
  `entitlements.effective_set.snapshot.get@1`. A product binds both in place of `MemoryPlanSnapshotsDriver`, so
  `@Requires`, the entitlement check and reserve-then-commit answer from the tenant's actual plan.

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [09b2c41]
- Updated dependencies [11a19a7]
- Updated dependencies [45afd22]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/database@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/locking@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/database@0.28.0
  - @stackra/locking@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [4a4d817]
  - @stackra/database@0.27.0
  - @stackra/locking@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0

## 0.26.0

### Patch Changes

- Updated dependencies [93e358e]
- Updated dependencies [9cee75d]
- Updated dependencies [a9f21b6]
  - @stackra/database@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/locking@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [1d7bbc1]
- Updated dependencies [dc9da69]
- Updated dependencies [8f8ddcf]
- Updated dependencies [3942ab1]
  - @stackra/database@0.25.0
  - @stackra/locking@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [f86dec4]
- Updated dependencies [2df7162]
  - @stackra/actions@0.24.0
  - @stackra/database@0.24.0
  - @stackra/locking@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [12f4836]
- Updated dependencies [82238da]
- Updated dependencies [6edeee4]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
  - @stackra/database@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/locking@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [b394912]
- Updated dependencies [786848c]
  - @stackra/database@0.22.0
  - @stackra/actions@0.22.0
  - @stackra/locking@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/database@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/locking@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [667a3b5]
- Updated dependencies [80d121b]
- Updated dependencies [a7b7e58]
- Updated dependencies [19a9222]
  - @stackra/actions@0.20.0
  - @stackra/database@0.20.0
  - @stackra/container@0.20.0
  - @stackra/locking@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [b59aa22]
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
- Updated dependencies [d2b3d22]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/database@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/locking@0.19.0

## 0.18.1

### Patch Changes

- @stackra/actions@0.18.1
  - @stackra/database@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/locking@0.18.1

## 0.18.0

### Patch Changes

- @stackra/actions@0.18.0
  - @stackra/database@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/locking@0.18.0

## 0.17.2

### Patch Changes

- @stackra/actions@0.17.2
  - @stackra/database@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/locking@0.17.2

## 0.17.1

### Patch Changes

- @stackra/actions@0.17.1
  - @stackra/database@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/locking@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/database@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/locking@0.17.0

## 0.16.0

### Patch Changes

- @stackra/actions@0.16.0
  - @stackra/database@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/locking@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/actions@0.15.0
  - @stackra/database@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/locking@0.15.0

## 0.14.4

### Patch Changes

- @stackra/actions@0.14.4
  - @stackra/database@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/locking@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/database@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/locking@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/database@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/locking@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/database@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/locking@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/database@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/locking@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/database@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/locking@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/database@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/locking@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/database@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/locking@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/database@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/locking@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/locking@0.10.0
  - @stackra/container@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [2e43c48]
- Updated dependencies [f9c825d]
  - @stackra/contracts@0.9.0
  - @stackra/container@0.9.0
  - @stackra/database@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/locking@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/locking@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/actions@0.7.1
  - @stackra/database@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/locking@0.7.1

## 0.7.0

### Patch Changes

- @stackra/actions@0.7.0
  - @stackra/database@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/locking@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/database@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/locking@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [fb29d41]
  - @stackra/database@0.6.0
  - @stackra/locking@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/locking@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1

## 0.5.0

### Patch Changes

- @stackra/actions@0.5.0
  - @stackra/database@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/locking@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [71b37fc]
- Updated dependencies [7a94bc4]
- Updated dependencies [a7eaed4]
- Updated dependencies [a8c358a]
- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
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
  - @stackra/actions@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/container@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/locking@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [a60f4e9]
- Updated dependencies [c4443b5]
- Updated dependencies [b00096a]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [be75ede]
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/locking@0.3.0

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
  - @stackra/locking@0.2.0
  - @stackra/container@0.2.0

## 0.1.0

### Minor Changes

- fd3427e: Consumption quotas from meters (stackra-309, ADR 0216 decision 3). A new `EntitlementKind.Quota` names the meter an
  action feeds and a `QuotaPeriod` (day, month, year). `PlanEntitlementCheckDriver` reads the meter's total for the
  current UTC period through the new `MeterTotals` port and refuses `quota_exceeded` (`QuotaExceededError`, with the
  key, meter, allowance and `resetsAt`) once the plan's allowance is used; a soft quota in its grace period passes and
  tells the optional `QuotaWarnings` port. `quotaWindow` gives a period's window.
- e01195a: Add the `./contracts` entry: `EntitlementUsage` moves there from `.` (import it from `@stackra/entitlements/contracts`).
  `EntitlementSource` stays in `.`, because its signature names the core `Entitlement` base.
- 783fb5b: Entitlement bundles per edition (ADR 0335 decision 6, stackra-64): `bundleEditionCatalogue(edition, bundle, base)`
  sells an edition's bundled base module entitlements (`EditionEntitlementBundle`, every tier or per tier) in its own
  plan catalogue, so `tierPlan` grants them and never an unbundled base module.
- c994359: `EntitlementSource#grant` takes a locked key (`billing`, `catalogue.product_limit`) as well as the class, and both
  resolve to the same record. Adds the `EntitlementKey` type, `isEntitled(source, entitlementOrKey, scope)`, key
  support in `entitlementKey` and key entries in `fakeEntitlements` (STA-1225).
- f7a2d36: Export `isLimitGrant` and `limitOf` from `.`. `planCatalogueOf` keeps rows of unknown record kinds in
  `PlanCatalogue.extras` instead of refusing them. Add the `CapLiftFacts` contract type, the optional
  `PlanSnapshot.paidSince` and `paidPlanDays` for the cap lift.
- 2787c1e: Add `@stackra/entitlements`: the `Entitlement({ kind, counts })` kind for feature, limit and module rights, the
  `EntitlementSource` and `EntitlementUsage` ports, `PlanEntitlementCheckDriver` for the action pipeline's entitlement
  step (grants and counts in the call's `scope`) with `registerEntitlements` and `entitlementKey`, the `LimitReachedError` refusal (`limit_reached`) and
  `fakeEntitlements` (`./testing`).
- 5a25b49: Add the plan-catalogue admin mechanism (ADR 0391): dated `CatalogueVersion`s behind the `CatalogueVersions` port with a
  memory driver, `PlanCatalogueService` (seed from a product seed pack, propose, approve with a second approver for
  discounts, reject, the version in force at a term's start so changes reach subscribers at renewal), `versionInForce`,
  the plan catalogue types with `planCatalogueOf`, and `tierPlan` to turn a tier and add-ons into a plan snapshot.
- d58a505: Soft limits with grace (`LimitGrant`, `limitAllows`) in the plan driver; `EntitlementSource` moves to `./contracts`
  (still re-exported from `.`) with `PlanSnapshotEntitlementSourceDriver` over the new `PlanSnapshots` port;
  reserve-then-commit at a limit (`LimitReservationService`, on `@stackra/locking`); and the seat-kind meter
  (`SeatMeterService`, the `SeatLedger` port, `SeatLimitReachedError`), with memory drivers.
- f65a9e9: Add the numeric value kind `EntitlementKind.Value` and `EntitlementValueService.valueOf` to read it from the effective
  plan (STA-824), and `PlanLimitReservationDriver`, the pipeline's `LimitReservation` over `LimitReservationService`, so
  every create a limit gates is reserved around its unit of work (STA-765, ADR 0408).
- 187afe3: `CatalogueRow` has one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/pricing` and `@stackra/entitlements`
  no longer export their identical copies; import `CatalogueRow` from `@stackra/contracts`.
- 3b19f6d: Rate limits as ADR 0217 decision 2 promises (STA-1477). `RateLimitedError` carries the refusing bucket's
  `retryAfterMs`, `limit` and `remaining`, and the new `rateLimitHeaders` turns them into `Retry-After` and
  `RateLimit-*`. The pipeline keys the area bucket by (app, scope), passes the bucket's numbers on the refusal and, with
  an outbox bound, writes one `actions.rate_limited` usage event per refusal. `EntitlementRateLimitBudgetDriver` sizes
  the area bucket from the plan's `rate_limit.<area>_per_minute` and `rate_limit.<area>_burst` value entitlements. The
  generated HTTP adapter answers a rate-limited refusal with 429, its envelope and the headers.

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
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
- Updated dependencies [bc4acfc]
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
- Updated dependencies [483eb44]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [2787c1e]
- Updated dependencies [484dc58]
- Updated dependencies [396e384]
- Updated dependencies [d5e5ff8]
- Updated dependencies [b62c042]
- Updated dependencies [914465a]
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
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [a31d463]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [e756399]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [2c0ea71]
- Updated dependencies [ab9cc36]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/locking@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/errors@0.1.0

Written by Changesets on release; never edited by hand.

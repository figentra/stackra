# @stackra/entitlements

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

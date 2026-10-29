# @stackra/registry

## 0.1.0

### Minor Changes

- 8249be0: `MoneyAmount` and `CurrencyCode` in place of bare minor-unit pairs (STA-1383). Breaking:
  
  - `@stackra/loyalty-kit/contracts`: `EarnRequest` and `EarnDraft` take `amount: MoneyAmount` instead of `amountMinor`
    and `currency`; `RedemptionQuote` returns `amount: MoneyAmount` instead of `amountMinor`; `LoyaltyService.quote`
    takes `total: MoneyAmount` instead of `totalMinor`. The stored redeem input and output schemas keep `totalMinor` and
    `amountMinor`; the workflow maps at that boundary with the run's currency.
  - `@stackra/registry`: `computePartnerPayout` takes a `MoneyAmount` gross and returns `{ gross, fee, net }` amounts;
    `PerkListingCharge` carries `amount: MoneyAmount` instead of `currency` and `amountMinor`. The stored `PartnerPayout`
    and `FeeSchedule` records keep their columns.
  - `@stackra/ledger`: `JournalEntry.currency` is a `CurrencyCode`; the amount stays a number so points journals work.
  
  loyalty-kit, registry and ledger now depend on `@stackra/money`.
- ffa7758: Add the app market records of ADR 0355 decision 8: `AppReview` with `ReviewState` and `canTransitionReview`,
  `DeveloperSandbox`, `FeeSchedule` and `PartnerPayout` with `computePartnerPayout` (basis points rounded half up plus a
  fixed fee, never above the gross); and the edition install of ADR 0335: `EditionBundle` and `planEditionInstall`
  (dependency order, bundled base modules only, inert contributions to enhanced modules).
- 8d3f7b2: `CatalogueManifest` now declares the catalogue fields a registry stores: a module's `enhances`, `intents` and
  `entitlement`, an action's `tool` (gen's `{ name, default, hints }` or `true`) and `toolOff`, and an event's `webhook`,
  `dataClasses` (`DataClassification` codes) and `thinFields`. New `deliverableEvents(manifest, previous?)` returns the
  webhook event catalogue rows (`DeliverableEventRow`, `DeliverablePayload` thin or full) to register at manifest
  publish, with withdrawn rows for opt-ins a release dropped.
- 783fb5b: Edition records (ADR 0335, stackra-64): `EditionBundle` takes optional `packs` and `rolePresets` record keys, and
  `checkEditionBundle` refuses a bundle whose base has no release in range (`base_unknown`), that bundles a module the
  base does not declare (`bundled_module_unknown`) or whose own module takes a base key (`module_key_taken`).
- 2787c1e: Add `@stackra/registry`, module catalogue validation for a registry service: the `CatalogueManifest` shape of a
  published `stackra.manifest.json` with its shipped schema, and `validateCatalogue`, which checks a set of manifests for
  shape, duplicate members, identity collisions, unknown modules, foreign namespaces, unknown dependencies and dependency
  cycles, returning `CatalogueDiagnostic` values with a `CatalogueDiagnosticCode` in an order that does not depend on the
  order of the input.
- d79debf: Add the `perk` listing role (ADR 0393): `ListingRole`, `PerkRedemptionKind`, the `PerkListing` record, `perkEligible`,
  `redeemPerk` (a lead only after consent) and the `perkListingFee` hook, plus the seeded startup-perk eligibility and
  offer-stacking rule sets and the editable incubator list in `assets/data/`.

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
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
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
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/contracts@0.1.0
  - @stackra/money@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

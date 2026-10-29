# @stackra/pricing

## 0.1.0

### Minor Changes

- 59ac846: One address and one party (STA-1383). `@stackra/validation` keeps the market-format `Address` as the source and adds
  `Party` (name, email, phone, `Address`). Breaking:
  
  - `@stackra/payments/contracts`: `PaymentAddress` and `PaymentParty` are removed; `CheckoutRequest.customer` is a
    validation `Party` (the address takes `lines` and `locality`, not `line1` and `city`).
  - `@stackra/pricing/contracts`: `TaxAddress` is `Pick<Address, "country" | "region" | "postalCode">`; a missing region
    or postal code is left out instead of `null`, and `country` is a `CountryCode`.
  - `@stackra/shipping/contracts`: `ShippingAddress` extends `Address` (`city` is now `locality`, optional; the
    coordinates are a `GeoPoint`) and `ShippingParty` extends `Party`.
  - `@stackra/fiscal/contracts`: `FiscalAddress.country` is the `Address` country (`CountryCode`); the rest keeps its
    document-format shape.
  
  payments, pricing and shipping now depend on `@stackra/validation` (types only).
- 187afe3: `CatalogueRow` has one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/pricing` and `@stackra/entitlements`
  no longer export their identical copies; import `CatalogueRow` from `@stackra/contracts`.
- f833d94: <!--
  Stackra file contract:
  Purpose: the changeset of stackra-62 (STA-931) for @stackra/pricing: the production tax driver and its gateway type.
  Boundary: release notes only.
  Runtime: none (Markdown)
  Governing contract: ADR 0379; ADR 0443.
  -->
  
  Add `ConnectionTaxProviderDriver`, the production `TaxProvider` (ADR 0379): the Market's pack engine, read through the
  new host type `TaxTables`, picks `taxByRates` over its own table or the `tax` Connection `ProviderResolver` resolves
  (Stripe Tax as the managed default for `us`, Avalara and TaxJar own-account, all pack data). It also records and voids
  a finalised sale at the same Connection; provider quote sources and transaction ids are
  `<provider>:<connectionId>:<id>`. New contract type `TaxGateway` (`./contracts`), which the vendor Connections in OS
  integrations implement. New dependency: `@stackra/integrations` (types only; no cycle).
- 85b7b49: Add the pure price evaluation (ADR 0337): `resolvePrice` over price lists by currency, Market, sales channel and date,
  with fixed, graduated and formula prices (`PriceKind`, `evaluateFormula` over rate snapshots and item fields) and
  derived lists with a markup and a price point; tax from a market's own rate table (`taxByRates`) and the `TaxProvider`
  port in a new `./contracts` entry with `MemoryTaxProviderDriver`.
- 2787c1e: Add `@stackra/pricing`, pricing primitives on `@stackra/money`. `PricePoint.ofMinor(step, ending, currency)` describes
  the price points a market rounds to (`100, 99, "USD"` is 0.99, 1.99, 2.99 …) and `apply(price, rounding)` moves a price
  onto one, up by default, with zero kept free. `GraduatedPrice.of(tiers)` prices metered usage in ascending `PriceTier`
  bands, the first often an included amount, and `total(quantity)` is the exact charge. Price models as a kind, price
  resolution and markets are not part of this package.
- c63175b: Add plan price lists keyed by regional tier and price currency (`planPriceListsOf`, `planPrice`, `priceListKey`),
  `isCatalogueDiscount`, rate cards (`rateCardOf`, `meterCharge`), billing terms per pack with separate price and
  collection currency and an invoice series per billing seller (`BILLING_PACK_KEYS`, `billingTermsOf`), and offers with
  `benefits[]` (`offerOf`, `offerEligible`, `stackOffers`, `applyOffers`) (ADR 0391 to 0393).

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
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 2612a7e: One rounding vocabulary (STA-1383). Breaking: `Rounding` moves from `@stackra/money` to `@stackra/contracts` (same
  four codes, same order); import it from `@stackra/contracts`. `@stackra/support`'s `QuantityRounding` stays a
  dependency-free union and is documented, and type-tested in money, as the `down`, `up` and `half_up` subset of it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [072a443]
- Updated dependencies [ae3d280]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [2ead19c]
- Updated dependencies [a9d39cf]
- Updated dependencies [ae5f6cd]
- Updated dependencies [24671ba]
- Updated dependencies [975a6c1]
- Updated dependencies [865cf77]
- Updated dependencies [90e65ce]
- Updated dependencies [0046fbd]
- Updated dependencies [834d55b]
- Updated dependencies [c2b8ed4]
- Updated dependencies [2787c1e]
- Updated dependencies [47cc2f6]
- Updated dependencies [2432cca]
- Updated dependencies [ffda24c]
- Updated dependencies [fa0ed99]
- Updated dependencies [09823c1]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
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
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [f04fec9]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [fc51f13]
- Updated dependencies [c7e6988]
- Updated dependencies [d19a3d5]
  - @stackra/integrations@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/money@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

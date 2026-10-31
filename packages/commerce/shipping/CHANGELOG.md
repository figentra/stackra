# @stackra/shipping

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [9085c41]
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/money@0.2.0
  - @stackra/testing@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 914465a: One capability-gateway check (STA-1383): `@stackra/contracts` adds `capabilityGuard<M>()`, and payments and shipping
  bind it to their maps. Breaking renames: `@stackra/payments` `hasCapability` is `hasPaymentCapability` and its
  `CapabilityGateways` is `PaymentCapabilityGateways`; `@stackra/shipping` `hasCapability` is `hasCarrierCapability` and
  its `CapabilityGateways` is `CarrierCapabilityGateways`.
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
- c34bf79: `GeoPoint` has one home, `@stackra/contracts`. Breaking: `@stackra/rules/contracts`, `@stackra/shipping/contracts` and
  `@stackra/i18n/contracts` no longer export their identical copies; import `GeoPoint` from `@stackra/contracts` (STA-1383).
- 61ae09d: Add `@stackra/shipping`: the carrier ports (rate quote, label with cancel, pickup with cancel, tracking) that OS
  integrations connectors implement, the `CarrierGateways` port that picks a carrier per tenant and Market through the
  Connection, `TrackingState` with `normaliseTracking` over a connector's code map, PDF and ZPL label documents checked by
  `labelDocument` and joined by `batchZpl`, and `dimensionalWeight` and `chargeableWeight` from a carrier's factor.
- 4a0e0e5: <!-- Stackra file contract: Purpose: release note for stackra-55 (STA-928). Boundary: changeset only. Runtime: none.
  Governing contract: ADR 0369; R3-SO-09. -->
  
  Add pickup point and locker search (`CarrierCapability.PickupPoints`, `PickupPointGateway`, `PickupPointSearch`,
  `PickupPoint`, `PickupPointKind`; `LabelRequest.pickupPointId`), the provisional return label shape
  (`CarrierCapability.Returns`, `ReturnLabelGateway`, `ReturnLabelRequest`), the `DistanceMatrix` and `RouteSolver`
  routing ports with `MemoryDistanceMatrixDriver` and `MemoryRouteSolverDriver`, and the `./testing` entry with
  `CarrierGatewaysFake` (optional peer `@stackra/testing`). STA-745, STA-747.

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
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
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
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
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
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/money@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

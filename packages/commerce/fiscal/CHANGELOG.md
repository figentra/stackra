# @stackra/fiscal

## 0.2.0

### Patch Changes

- 1a9259b: The integration tier runs (STA-1570). `@stackra/vitest-config/int` adds `intTier(config)` and `INT_TESTS`
  (`src/**/__tests__/**/*.int.test.{ts,tsx}` and gen's `.stackra/tests/**/*.int.test.ts`); `servicePreset`'s `int`
  project uses the same globs. The members with `.int.test.ts` files gain `vitest.int.config.ts` and a `test:int` script,
  which the new turbo task `test:int` and the Quality Gate run on a Testcontainers Postgres.
- Updated dependencies [2d5a888]
- Updated dependencies [9085c41]
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/market-packs@0.2.0
  - @stackra/money@0.2.0
  - @stackra/testing@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 955f180: Fiscal certification harness (stackra-31, owner decision D3: certification pending). `./testing` gains
  `runCertification` and `certificationCases()`: recorded reference cases per authority built from the published
  specifications (ZATCA PIH seed, profile and TLV QR; AEAT Verifactu `Huella` examples 1 and 2, QR URL and namespaces;
  DSFinV-K receipt QR; RKSV machine-readable code and start-receipt chain value; ETA e-receipt chain start and share QR),
  with the authorities' sandbox endpoints in their pack options, runnable offline or against a sandbox from config (the
  `.int` tier reads `STACKRA_FISCAL_SANDBOX`). Fix: ZATCA standard invoices state the supply date (`cac:Delivery`,
  BR-KSA-15) from the new optional `FiscalDocument.suppliedAt`, falling back to the issue date.
- 56b2942: Finish the fiscal remainder (stackra-30, ADR 0364 open questions 1 and 2). Egypt's B2C e-receipt is a second ETA driver,
  `EtaReceiptDriver` (key `eta-receipt`, `ETA_RECEIPT_OPTIONS`): receipt JSON, UUID over the canonical receipt chained by
  `previousUUID`, share-URL QR, submission and polling; `EtaOnboardingDriver` is now keyed `eta-receipt`. Validity polling
  is the optional `FiscalDriver.poll` with `FiscalService.pollSubmitted` and `FiscalJournal.submitted`; `EtaDriver.poll`
  reads the optional `statusUrl` option. `XadesEnvelopeSignerDriver` builds the ZATCA XAdES envelope over the new host
  port `FiscalSigningKey` (`SigningCertificate`, `SignatureRequest.signedAt`, `FiscalSignatureUnsupportedError`,
  `FiscalSigningKeyFake`). Guest checks: `FiscalService.sealCheck` with `FiscalCheck`, `FiscalCheckPart` and the
  `checkDocument` pack value (`CheckDocumentMode`: `per_part`, `whole_check`) over any till driver.
- 4d1747b: Add `MarketPackFiscalPackSourceDriver`, the production `FiscalPackSource` over `@stackra/market-packs`: it reads
  `fiscal.invoice` and `fiscal.till` from the resolved market on the date asked, answers `null` for an unknown market and
  refuses a malformed value with `FiscalOptionsInvalidError`.
- 63d0473: Add `@stackra/fiscal`: e-invoicing and till fiscal drivers behind one `FiscalDriver` port, chosen per market and channel
  by market-pack data (ADR 0364). Drivers `zatca` (UBL, chained hash, XAdES, TLV QR, reporting and clearance), `eta`
  (item codes, canonical form, CAdES seal), `peppol` (EU and ASP routes), `factur-x` (CII and hybrid PDF), `tse`,
  `nf525`, `fdm`, `rt`, `rksv` and `verifactu`; `FiscalService` seals offline on a per-unit chain, submits in order and
  exports the journal; `ZatcaOnboarding` issues a CSID per till; ports for the pack, journal, signer, transport, device,
  credentials, turnover cipher and hybrid PDF; a memory journal, refusals, option schemas, fakes and fixtures.
- 27efea7: Memory drivers for the unit tier: `MemoryFiscalDriver` (key `memory`; seals hash over the previous hash, submit
  accepts everything, `exportJournal` writes JSON lines) and `MemoryTabularReaderDriver` / `MemoryTabularWriterDriver`.
  Both packages ship their `stackra.manifest.json`.
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
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
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
- Updated dependencies [c21a223]
- Updated dependencies [c1818fd]
- Updated dependencies [b88a78d]
- Updated dependencies [38ef655]
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
- Updated dependencies [9fc14fd]
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [fd13f0e]
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
  - @stackra/market-packs@0.1.0
  - @stackra/money@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

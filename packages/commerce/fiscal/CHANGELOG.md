# @stackra/fiscal

## 0.33.0

### Minor Changes

- 0a8f6b2: `FiscalTarget` gains an optional `options` field for driver options that are a unit's own rather than the market's. Examples are ETA's `activityCode` (the issuer's registered activity) and Peppol's `accessPointUrl` (the tenant's own provider). The host fills it from its unit and connection.
  
  `FiscalService` merges these options under the pack's options for seal, submit, poll and journal export. The pack wins on a key both hold, so a unit can never redirect a market fact such as `submitUrl`. A field that neither the pack nor the unit holds is still refused with `fiscal_options_invalid`, which names the field.
  
  Market packs carry market facts only.

### Patch Changes

- Updated dependencies [93d63bb]
- Updated dependencies [7c34d68]
- Updated dependencies [26a2d54]
- Updated dependencies [7c34d68]
- Updated dependencies [7c34d68]
- Updated dependencies [41a5ff0]
- Updated dependencies [93d63bb]
  - @stackra/contracts@0.33.0
  - @stackra/market-packs@0.33.0
  - @stackra/testing@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/money@0.33.0
  - @stackra/container@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- @stackra/errors@0.32.0
  - @stackra/market-packs@0.32.0
  - @stackra/money@0.32.0
  - @stackra/testing@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- 2b1dac5: `EtaDriver` now reads a rejected submission's reference from `submissionUUID`, the name ETA's SDK uses, and falls back to `submissionId`. Before this, a real ETA answer left the reference empty.
- @stackra/money@0.31.0
  - @stackra/testing@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/market-packs@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Minor Changes

- c6c1d21: `CadesSignerDriver`, the `FiscalSigner` for ETA's detached CAdES-BES: a CMS `SignedData` over the request's digest
  with the content type, message digest, `ESSCertIDv2` and signing time as signed attributes and the certificate
  inside, signed by the host's `FiscalSigningKey` (RSA or EC, as the certificate says), so a token, an HSM or a cloud
  e-seal provider signs and the private key never reaches the package. `EtaDriver` now passes the sealing time as
  `signedAt`, so ETA's signature carries it.

### Patch Changes

- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [8c17109]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
  - @stackra/contracts@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/container@0.30.0
  - @stackra/money@0.30.0
  - @stackra/market-packs@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/testing@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [b4b6422]
  - @stackra/container@0.29.0
  - @stackra/money@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/market-packs@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/testing@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- @stackra/money@0.28.0
  - @stackra/testing@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/market-packs@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- @stackra/money@0.27.0
  - @stackra/testing@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/market-packs@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- @stackra/money@0.26.0
  - @stackra/testing@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/market-packs@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- @stackra/money@0.25.0
  - @stackra/testing@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/market-packs@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- @stackra/money@0.24.0
  - @stackra/testing@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/market-packs@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- @stackra/money@0.23.0
  - @stackra/testing@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/market-packs@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- @stackra/money@0.22.0
  - @stackra/testing@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/market-packs@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/money@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/market-packs@0.21.0
  - @stackra/testing@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [a7b7e58]
- Updated dependencies [667a3b5]
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/money@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/market-packs@0.20.0
  - @stackra/testing@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- e105174: The infrastructure and developer packages describe sops and figentra/secrets instead of Infisical (ADR 0525).
  
  - `@stackra/infra-aws-runtime`: the RDS Proxy login secret's description names the vault, not Infisical, so the next
    apply updates that description in place. The docs name the vault and runway's secrets sync.
  - `@stackra/infra-tools`: the tools-stack secrets sync is the vault's (`secretsSync` keeps its shape: `source`,
    `principal`, `externalId`); the missing external id error names the secrets sync.
  - `@stackra/infra-github`, `@stackra/infra-cloudflare`, `@stackra/infra-identity`, `@stackra/infra-observability`,
    `@stackra/runway`, `@stackra/mcp`, `@stackra/cli`, `@stackra/fiscal`, `@stackra/licensing`: docs and comments only.
    `githubPlan` still turns `providers.infisical` into the `INFISICAL_*` CI variables until plan phase P6.
- Updated dependencies [58e3066]
- Updated dependencies [bac874e]
  - @stackra/contracts@0.19.0
  - @stackra/money@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/market-packs@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/testing@0.19.0

## 0.18.1

### Patch Changes

- @stackra/money@0.18.1
  - @stackra/testing@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/market-packs@0.18.1
  - @stackra/validation@0.18.1

## 0.18.0

### Patch Changes

- @stackra/money@0.18.0
  - @stackra/testing@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/market-packs@0.18.0
  - @stackra/validation@0.18.0

## 0.17.2

### Patch Changes

- @stackra/money@0.17.2
  - @stackra/testing@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/market-packs@0.17.2
  - @stackra/validation@0.17.2

## 0.17.1

### Patch Changes

- Updated dependencies [0b917cf]
  - @stackra/market-packs@0.17.1
  - @stackra/money@0.17.1
  - @stackra/testing@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/validation@0.17.1

## 0.17.0

### Patch Changes

- @stackra/money@0.17.0
  - @stackra/testing@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/market-packs@0.17.0
  - @stackra/validation@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/market-packs@0.16.0
  - @stackra/money@0.16.0
  - @stackra/testing@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/money@0.15.0
  - @stackra/testing@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/market-packs@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- @stackra/money@0.14.4
  - @stackra/testing@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/market-packs@0.14.4
  - @stackra/validation@0.14.4

## 0.14.3

### Patch Changes

- @stackra/money@0.14.3
  - @stackra/testing@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/market-packs@0.14.3
  - @stackra/validation@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/money@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/market-packs@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/testing@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/money@0.14.1
  - @stackra/testing@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/market-packs@0.14.1
  - @stackra/validation@0.14.1

## 0.14.0

### Patch Changes

- @stackra/money@0.14.0
  - @stackra/testing@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/market-packs@0.14.0
  - @stackra/validation@0.14.0

## 0.13.0

### Patch Changes

- @stackra/money@0.13.0
  - @stackra/testing@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/market-packs@0.13.0
  - @stackra/validation@0.13.0

## 0.12.0

### Patch Changes

- @stackra/money@0.12.0
  - @stackra/testing@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/market-packs@0.12.0
  - @stackra/validation@0.12.0

## 0.11.1

### Patch Changes

- @stackra/money@0.11.1
  - @stackra/testing@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/market-packs@0.11.1
  - @stackra/validation@0.11.1

## 0.11.0

### Patch Changes

- @stackra/money@0.11.0
  - @stackra/testing@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/market-packs@0.11.0
  - @stackra/validation@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
  - @stackra/contracts@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/market-packs@0.10.0
  - @stackra/money@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/testing@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/container@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/market-packs@0.9.0
  - @stackra/money@0.9.0
  - @stackra/testing@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [7dd35b3]
  - @stackra/container@0.8.0
  - @stackra/money@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/market-packs@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/testing@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/money@0.7.1
  - @stackra/testing@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/market-packs@0.7.1
  - @stackra/validation@0.7.1

## 0.7.0

### Patch Changes

- @stackra/money@0.7.0
  - @stackra/testing@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/market-packs@0.7.0
  - @stackra/validation@0.7.0

## 0.6.1

### Patch Changes

- @stackra/money@0.6.1
  - @stackra/testing@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/market-packs@0.6.1
  - @stackra/validation@0.6.1

## 0.6.0

### Patch Changes

- @stackra/money@0.6.0
  - @stackra/testing@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/market-packs@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- @stackra/money@0.5.1
  - @stackra/testing@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/market-packs@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- @stackra/money@0.5.0
  - @stackra/testing@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/market-packs@0.5.0
  - @stackra/validation@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [8d29426]
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/container@0.4.0
  - @stackra/market-packs@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/money@0.4.0
  - @stackra/testing@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [e6a582a]
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/market-packs@0.3.0
  - @stackra/money@0.3.0
  - @stackra/testing@0.3.0
  - @stackra/validation@0.3.0

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

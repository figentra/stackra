# @stackra/validation

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
- 2babf37: Ship the `X$` schema of each contract type a shape field names (STA-1284): `Address$`, `ScopeRef$`, `Actor$`,
  `Signature$` and `SignerPublicKey$` from `@stackra/validation`; `IsoDate$`, `HijriDate$`, `WorkingWeek$` and the
  `WorkingWeek` type from `@stackra/calendar`; `CustomFieldDefinition$` and `CustomFieldValue$` from `@stackra/content`;
  `ImportChange$` and `RowError$` from `@stackra/data-transfer/contracts`; `PromotionDiff$` from
  `@stackra/settings/contracts`; `Audience$` from `@stackra/iam/contracts`. `Condition$` already ships from
  `@stackra/rules`.
- 8a1be69: The remaining v3 field decorators of ADR 0294 R6: `@Lowercase` (a transform gen compiles to `.toLowerCase()`),
  `@Hidden` and `@Visible({ audience })` with `OutputAudience` (serializers) in `@stackra/validation`, and `@OneToOne`
  in `@stackra/model`. Gen leaves a `@Hidden` field out of the shape's `X$`, its `X$Check` and the manifest's JSON
  Schema, so it never goes out on the wire (stackra-260).
- a435dfd: `IdentifierFormat` gains `canonical`, a `$n` template that writes an identifier's stored form from its pattern's groups
  (the Dutch `1234 AB` postcode, ZIP+4, the EIN), so the Italian, Dutch and US formats are pack data (STA-788, STA-797,
  ADR 0403, ADR 0405).
- fc44d7a: Add identifier checks driven by market-pack data (`IdentifierFormat`, `IdentifierCheck`: Luhn, mod 97, GS1, century and
  birth date; `checkIdentifier`, `identifier`, `normalizeIdentifier`) for national IDs, Iqama, Emirates ID, VAT and TRN
  numbers and IBANs; `e164`; `countryCode`; `address` with `Address` and `AddressFormat`; GTIN, EAN and UPC check digits
  (`gtin`, `isGtin`, `gtinCheckDigit`); and one-time codes (`issueOneTimeCode`, `verifyOneTimeCode`: peppered HMAC,
  expiry, attempts, constant-time comparison).
- f7a2d36: `AddressFormat` gains `region`, which `address(format)` checks and stores. `AddressFormat$`, `IdentifierFormat$` and
  `NationalIdFormats$` parse pack values (`identity.address_format`, `identity.national_ids`, `identity.<name>`) without
  casts and export JSON Schema for pack section schemas. `nationalId(formats)` and `NationalId` check an identity document
  number against the kinds its market issues; kinds and patterns stay pack data.
- 2787c1e: Add `@stackra/validation`, the shapes and field rules of the programming model v3.1, absorbing the retired
  `@stackra/schema` and folding the old `./runtime` entry into `.`: the `Schema` kind base with a typed `X.create`;
  `CursorInput`, `TableInput` and `Page.of`; `PickType`, `OmitType` and `PartialType`; the field decorators `@Str`,
  `@Int`, `@Num`, `@List` (with `each` for lists and maps), `@Trim`, the `@Field(zod)` escape hatch, `@Classified` and
  `@Renamed` (class or field), each made with `createDecorator`, record-only and typed against its field; `validate`,
  `schemaOf` and `registerSchemas`, the registry generated schemas fill (gap G1), which fails clearly for a class with no
  schema; the runtime helpers generated code imports, `publicId`, `isoDateTime`, `json`, `url`, `duration` and
  `tableInput`; and the `Assert`, `Fields` and `Same` types of each generated `X$Check`. `Enum` stays in
  `@stackra/contracts` and the money codecs in `@stackra/money`.

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
- 150fa18: `duration(text)` is now `Duration.parse`, which reads the short form itself; behaviour is unchanged. (stackra-223)
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
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [65f5ac1]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [e756399]
- Updated dependencies [d19a3d5]
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0

Written by Changesets on release; never edited by hand.

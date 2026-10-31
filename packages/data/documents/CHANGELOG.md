# @stackra/documents

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [2d5a888]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/integrations@0.2.0
  - @stackra/data-transfer@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/support@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 6da76a2: Add the default e-signature connector: `DocumensoIntegration` and `DocumensoConnection` (Documenso self-hosted, API v1,
  certification pending) and `ConnectionESignatureDriver`, the `connection` driver of `ESignatureProvider` that picks the
  provider per call through `ProviderResolver` (ADR 0356) and keeps follow-ups on the same Connection. Add the
  `signature_signer_unreachable` refusal. The package now uses the `decorators` presets. New dependencies:
  `@stackra/config`, `@stackra/integrations` (STA-959).
- a45aec8: `ConnectionESignatureDriver`'s constructor takes the `ProviderResolver` only (class tokens, STA-1365). The provider
  map is the `protected readonly drivers` member, `{ documenso: DocumensoConnection }` by default; a host subclasses the
  driver and overrides `drivers` with its own map instead of passing it to the constructor.
- 281ec71: Add `@stackra/documents`: one print template model (builder kind `print`) rendered to HTML, PDF through the
  `PdfEngine` port and DOCX, with side-by-side and stacked bilingual layouts, bidi-isolated values, QR codes, amounts in
  words from market-pack currency names (Arabic and English spellers), Arabic shaping and visual ordering for devices
  that cannot shape, signed form PDFs with content and signature hashes, and the `ESignatureProvider` port with its
  memory driver (ADR 0365).
- 830898b: Add the `gotenberg` drivers of `PdfEngine` (headless Chromium, which shapes Arabic) and of the new `PdfAssembler` port
  (merge several PDF labels into one file; Factur-X hybrid invoices as PDF/A-3b), `HybridPdfBinding` for
  `@stackra/fiscal`'s `HybridPdf`, the `pdf_engine_failed` refusal, the EAN-13 `barcode` block (`encodeEan13`), the
  `struck` text role, the template `purpose` code and `LABEL_PURPOSE` for shelf, food and short-dated labels. QR values
  uqr cannot encode are now refused as `document_value` with the block's path.
- 9ab18b4: Queued resource export (STA-1490, reporting gap 11, ADR 0307 rule 10). `@stackra/panel/node` adds `ExportRunner`: it
  pages a resource's list query as the reader (per-row permissions), drops `@Classified` columns unless opted in under an
  L2 permission, streams at most `maxRows` rows into CSV, XLSX, JSON Lines or PDF on the host disk, and returns a 24-hour
  signed link whose issue is access-logged. Adds `ExportInput`, `ExportOutput`, `ExportSource`, `ExportConfig`
  (`ExportOptions`, `ExportConfig$`), and `ExportFormat.JsonLines` and `ExportFormat.Pdf`. `@stackra/documents` adds
  `PdfTableWriter`, data-transfer's `TabularWriter` for PDF, built per export. New dependencies: panel on
  `@stackra/access-log`, `@stackra/config`, `@stackra/data-transfer`, `@stackra/documents`, `@stackra/filesystem`;
  documents on `@stackra/data-transfer`.

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
- fd13f0e: Import the shared helpers from `@stackra/support` and delete the local copies (stackra-224): notifications
  (`base64url`, `htmlToText`), webhooks and licensing (`decodeBase64`; licensing also `isRecord`), rules (`isRecord`),
  data-transfer and identity (`crc32`), documents and experience (`escapeHtml`; experience's `./edge` and `./server`
  re-export support's), experience (`htmlToText`: the text part now has a blank line after each block, as notifications'
  did), seo and brand-kit (`escapeXml`; brand-kit now refuses a control character), market-packs (`canonicalJson`: the
  one canonical form, so integer-like keys sort as text), gen (`snakeCase`, `kebabCase`, `camelCase`, `pascalCase`),
  panel (`snakeCase`), calendar (`ageOn`, re-exported beside `LeapBirthday`) and identity (`ageOn`). Identity's
  `ActForOptions` gains `leapBirthday` (the market pack's 29 February rule; `march_1` when absent, the earlier
  behaviour). New dependency for each except licensing: `@stackra/support`.
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
- Updated dependencies [072a443]
- Updated dependencies [bc4acfc]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
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
- Updated dependencies [dddbbcd]
- Updated dependencies [e2a4b0d]
- Updated dependencies [b3c4658]
- Updated dependencies [975b28c]
- Updated dependencies [e7ee0a4]
- Updated dependencies [a701ccb]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [27efea7]
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
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [f04fec9]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [fc51f13]
- Updated dependencies [c7e6988]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/integrations@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/data-transfer@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/support@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

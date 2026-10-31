# @stackra/market-packs

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [9085c41]
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/assets@0.2.0
  - @stackra/filesystem@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/support@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- c21a223: `FloorBound.List`: a list floor a value may add to but never drop from; `MarketPack$` requires a list value and
  `overlayFloorIssues` reports an overlay that drops an item. `ResolveOptions.requireBase: false` resolves product
  sections for a market with no base pack, nesting by market code. `pickPack` is exported from the `.` entry (ADR 0455,
  STA-917).
- c1818fd: Add `@stackra/market-packs`, the market-pack loader: `signPack` and `verifyPack` for signed, content-hashed packs
  (SHA-256 of canonical JSON, Ed25519 against trusted keys; a failing pack is refused with `PackRejectedError`),
  `resolvePack` for overlays (`eu` then `eu-de`), product sections, per-market pins to a major line or an exact version
  and accepted pack statuses, `valueOf` and `valuesOn` for "the value of X for market M on date D" over dated entries,
  `floorsOn` for legal floors with their law, `factsOn` as a rules fact source, and `unreviewed` and `launchGate` for
  reviewer sign-off and the launch checklist per pack and product. The package holds no pack content.
- b88a78d: Serve a deployment's verified packs and check packs before they are signed (ADR 0417, 0418). `ResolvedPackSource` is
  an injectable port with `packs()` and `valueFor(market, key, options)`, exported by the new `MarketPacksModule`
  (`./node` entry), with a `store` driver (the hashes in `MarketPacksConfig`, fetched from `PackStore` and verified
  against the configured trusted keys) and a `memory` driver. `PackSchemaRegistry` checks every key and value of a pack
  against the registered section schemas (JSON Schema per key, owned by OS or the product) and asks root packs for their
  required keys; `overlayFloorIssues` refuses an overlay that drops or loosens a parent's legal floor. The draft `us`
  pack now carries the ADR 0405 identity formats, the optional 5-cent cash rounding and the ADR 0392 billing terms.
- 38ef655: Finish the market-pack loader (ADR 0385): `subjects` per key and `MarketContext.packFor(record, ruleKind)` answer each
  rule kind from the market of its subject (location, buyer, entity or tenant), refusing a record without it
  (`SubjectMarketMissingError`); overlays resolve at any depth with a product section per overlay; signed packs are
  stored and fetched by content hash through the `PackStore` port and its `FilesystemPackStoreDriver`, loaded with
  `fetchPacks` (new rejection `not_stored`), and shipped packs are read with `readPackAssets`. The `us` base pack and
  seven state overlays ship as draft data assets.
- 9fc14fd: Put `@stackra/rules`, `@stackra/access-log`, `@stackra/scope`, `@stackra/market-packs`, `@stackra/devices`,
  `@stackra/collaboration` and `@stackra/payments` on the framework version line beside the packages the OS catalog
  already lists, with `@stackra/segments`, which `@stackra/iam` depends on and the catalog also lacks (STA-819).

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
- Updated dependencies [0061a8e]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
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
- Updated dependencies [d156aa8]
- Updated dependencies [6dd5245]
- Updated dependencies [a289662]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [20f3fe9]
- Updated dependencies [6919ebd]
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
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/assets@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/filesystem@0.1.0
  - @stackra/support@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

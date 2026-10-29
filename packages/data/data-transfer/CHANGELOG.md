# @stackra/data-transfer

## 0.1.0

### Minor Changes

- dddbbcd: `ImportRunner.run` and `runSheets` take `dryRun: true`: every row is mapped and validated as in a real run, but no
  target `upsert` is called and nothing is recorded in the `ImportLedger`. The report then has `written: 0`,
  `dryRun: true`, `valid` (rows that would be written) and every refused row (STA-918).
- e2a4b0d: Import several sheets of one workbook into several targets in one run (`ImportRunner.runSheets`), resumed per sheet and
  reverted per sheet's target, with mapping profiles from seed packs (`IMPORT_MAPPING_PROFILE_SCHEMA`, `sheetImportsOf`).
  Add the JSON Lines reader and writer, the durable `ImportLedger` contract with `purge` of before-images at the end of
  the undo window, and payroll pay-input exports from per-provider profiles (`payrollSheet`, `DatevAsciiWriterDriver`,
  seeded generic CSV, DATEV LODAS and ZenHR XLSX profiles). Breaking: the XLSX drivers move to the new `./node` entry
  (STA-711, STA-714, ADR 0431).
- b3c4658: Add `@stackra/data-transfer` (ADR 0367): the `TabularReader`, `TabularWriter` and `ImportLedger` ports in
  `./contracts`; streaming CSV and multi-sheet XLSX readers and writers; strict decoding with BOM and UTF-8 detection and
  a caller-given legacy fallback (for example a market pack's Windows-1256); Arabic header normalisation, `matchColumns`,
  `compileMapping` and `previewTabular`; and `ImportRunner`, which validates each row against the target's schema,
  reports refused rows, writes batches by key, records them in the ledger, resumes a failed run after its cursor and
  reverts a whole run inside the caller's undo window. Limits, batch size, preview size and the undo window are inputs,
  never defaults.
- 975b28c: Warehouse sink (ADR 0163 decision 5 and ADR 0190 decision 3, amended 2026-10-29). New `WarehouseSink` port with
  `WarehouseBatch` and `WarehouseWriteOptions` in `./contracts`; `WarehouseChangeSink` reads the retained outbox change
  log from its own cursor and writes one batch per model, scope and UTC day (`sync`, `replay`); the `parquet` driver
  `ParquetWarehouseSinkDriver` writes each batch to a `FileSystem` disk in the Hive layout `scope=/model=/dt=`. New
  dependency-free `ParquetWriterDriver` (`TabularWriter`, uncompressed, row groups of `TabularWriteOptions.rowGroupRows`)
  for one-off exports, and `warehouseBatches`, `warehousePath` and `warehouseSheet`.
- 27efea7: Memory drivers for the unit tier: `MemoryFiscalDriver` (key `memory`; seals hash over the previous hash, submit
  accepts everything, `exportJournal` writes JSON lines) and `MemoryTabularReaderDriver` / `MemoryTabularWriterDriver`.
  Both packages ship their `stackra.manifest.json`.
- 2babf37: Ship the `X$` schema of each contract type a shape field names (STA-1284): `Address$`, `ScopeRef$`, `Actor$`,
  `Signature$` and `SignerPublicKey$` from `@stackra/validation`; `IsoDate$`, `HijriDate$`, `WorkingWeek$` and the
  `WorkingWeek` type from `@stackra/calendar`; `CustomFieldDefinition$` and `CustomFieldValue$` from `@stackra/content`;
  `ImportChange$` and `RowError$` from `@stackra/data-transfer/contracts`; `PromotionDiff$` from
  `@stackra/settings/contracts`; `Audience$` from `@stackra/iam/contracts`. `Condition$` already ships from
  `@stackra/rules`.

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
- Updated dependencies [0abe92d]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [fb93026]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [3a9eb7e]
- Updated dependencies [cc8db5e]
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
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [09080ac]
- Updated dependencies [0a20a9f]
- Updated dependencies [2787c1e]
- Updated dependencies [3d34a5d]
- Updated dependencies [3b19f6d]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [e756399]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [d19a3d5]
  - @stackra/outbox@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/filesystem@0.1.0
  - @stackra/support@0.1.0

Written by Changesets on release; never edited by hand.

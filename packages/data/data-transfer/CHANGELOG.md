# @stackra/data-transfer

## 0.33.0

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [93d63bb]
- Updated dependencies [ad4e5bf]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/actions@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/outbox@0.33.0
  - @stackra/filesystem@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/container@0.33.0
  - @stackra/support@0.33.0

## 0.32.0

### Patch Changes

- @stackra/actions@0.32.0
  - @stackra/filesystem@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/outbox@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/support@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
  - @stackra/actions@0.31.0
  - @stackra/outbox@0.31.0
  - @stackra/filesystem@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/support@0.31.0

## 0.30.0

### Patch Changes

- 82dccb3: One shared owner-isolation helper. `@stackra/actions` now exports `inRowOwner(isolation, actorId, ownerId, id, work,
  missing?)`, `boundIsolation(resolver)`, `ClaimNotLoadedError` (`claim_not_loaded`) and `RowIsolationMissingError`
  (`row_isolation_missing`) from its `.` entry, so the tenancy families no longer each keep a copy. Every caller keeps
  its own system actor id (`sys_outbox_relay`, `sys_queue_worker`, `sys_scheduler`, `sys_workflow_runner`,
  `sys_privacy_holds`), the same refusals and the same rule: an owned row with no isolation bound is refused, never
  skipped. Queue and scheduler keep their prefixed refusals and codes (`job_row_isolation_missing`,
  `schedule_row_isolation_missing`, and their claim-not-loaded ones) and pass them to `inRowOwner`.
  
  `@stackra/outbox` still re-exports `boundIsolation`, `ClaimNotLoadedError` and `RowIsolationMissingError` from its `.`
  entry for this release only; the re-exports go away in the next minor, so import them from `@stackra/actions`. The two
  refusals now appear under `@stackra/actions` in the manifests, with the same codes. `@stackra/workflow` no longer
  depends on `@stackra/outbox`; `@stackra/data-transfer` now depends on `@stackra/actions`.
- Updated dependencies [418e195]
- Updated dependencies [6005425]
- Updated dependencies [0394e56]
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [8084b3a]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [98a8940]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [a03990d]
  - @stackra/actions@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/filesystem@0.30.0
  - @stackra/outbox@0.30.0
  - @stackra/container@0.30.0
  - @stackra/support@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [b4b6422]
  - @stackra/container@0.29.0
  - @stackra/outbox@0.29.0
  - @stackra/filesystem@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/contracts@0.29.0
  - @stackra/support@0.29.0

## 0.28.0

### Patch Changes

- @stackra/outbox@0.28.0
  - @stackra/filesystem@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/support@0.28.0

## 0.27.0

### Minor Changes

- 8a70552: The outbox tables are tenant-owned in the platform form (migration `outbox.0006_contract_outbox_tenancy`):
  `messages`, `deliveries`, `changes` (every partition, the default included), `replica_changes`,
  `device_sequences` and `offline_cap_uses` get a nullable `tenant_id`, filled from `app.tenant_id` by default (a
  NULL row is the platform's), forced row-level security and the platform policies. Cross-owner readers claim through
  system functions that return ids, owners and order or lease columns only, and load or change each row in its owner.
  
  Upgrade: drain the relay before you migrate. The migration backfills a row at a tenant node (`nlevel(scope_path) =
  3`) from its scope and keeps a row with no scope, at the root or at a product node, as a platform row. It refuses,
  changing nothing, while a message, delivery, change, replica change or device sequence sits below a tenant node,
  naming each count and the remedy: deliver or dead-letter pending messages and deliveries and delete those dead
  letters; let every change consumer pass such changes and delete them (or wait for retention); delete such replica
  changes (their devices fill again); settle and delete such device sequences. Existing `offline_cap_uses` rows have no
  scope and become platform rows.
  
  Platform messages and changes (written with no tenant) carry no personal data: no tenant's erasure can rewrite them.
  
  Breaking port changes, for a custom driver:
  
  - `OutboxDriver`: `due` is `claim` (returns `OutboxClaim`: id, `ownerId`, due time) plus `load(id)`; `pruneDead` is
    `claimDead`, each claim then deleted with `remove` in its owner.
  - `ChangeFeed`: `read` is `claim` (returns `ChangeClaim`: position, `ownerId`) plus `load(positions)`; `maintain` no
    longer deletes the default partition's expired rows: `expired` claims them and `remove` deletes them per owner
    (`maintainChangeLog` does both).
  - `DeliveryDriver`: `lease` and `list` return `DeliveryClaim` (id, `ownerId`, subscriber, state), `list` also takes
    an `id`, and `load(id)` returns the delivery.
  
  New in `@stackra/outbox`: `loadChanges`, `maintainChangeLog`, `boundIsolation`, `ClaimNotLoadedError` (a claimed row
  that does not load in its owner) and `RowIsolationMissingError` (an owned row with no `CallIsolation` bound). Both
  fail the work: a claimed row is never skipped. `pruneOutbox` takes the isolation as its last argument.
  
  `@stackra/data-maintenance`: `PruneOutboxAction` and `MaintainChangeLogAction` inject the `Container` and read the
  `CallIsolation` from it optionally. `@stackra/data-transfer`: `WarehouseChangeSink` takes the `Container` as its fourth
  argument and loads each owner's changes in its owner. An app without tenancy still boots; its platform rows run as
  before.

### Patch Changes

- Updated dependencies [8a70552]
  - @stackra/outbox@0.27.0
  - @stackra/filesystem@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/support@0.27.0

## 0.26.0

### Patch Changes

- @stackra/outbox@0.26.0
  - @stackra/filesystem@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/support@0.26.0

## 0.25.0

### Patch Changes

- @stackra/outbox@0.25.0
  - @stackra/filesystem@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/support@0.25.0

## 0.24.0

### Patch Changes

- @stackra/outbox@0.24.0
  - @stackra/filesystem@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/support@0.24.0

## 0.23.0

### Patch Changes

- @stackra/outbox@0.23.0
  - @stackra/filesystem@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/support@0.23.0

## 0.22.0

### Patch Changes

- @stackra/outbox@0.22.0
  - @stackra/filesystem@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/support@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/filesystem@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/outbox@0.21.0
  - @stackra/support@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [a7b7e58]
  - @stackra/container@0.20.0
  - @stackra/outbox@0.20.0
  - @stackra/filesystem@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/contracts@0.20.0
  - @stackra/support@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
  - @stackra/contracts@0.19.0
  - @stackra/filesystem@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/outbox@0.19.0
  - @stackra/support@0.19.0

## 0.18.1

### Patch Changes

- @stackra/filesystem@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/support@0.18.1
  - @stackra/outbox@0.18.1

## 0.18.0

### Patch Changes

- @stackra/filesystem@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/support@0.18.0
  - @stackra/outbox@0.18.0

## 0.17.2

### Patch Changes

- @stackra/filesystem@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/support@0.17.2
  - @stackra/outbox@0.17.2

## 0.17.1

### Patch Changes

- @stackra/filesystem@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/support@0.17.1
  - @stackra/outbox@0.17.1

## 0.17.0

### Patch Changes

- @stackra/filesystem@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/support@0.17.0
  - @stackra/outbox@0.17.0

## 0.16.0

### Patch Changes

- @stackra/filesystem@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/outbox@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0
  - @stackra/support@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [0b0cf51]
  - @stackra/outbox@0.15.0
  - @stackra/filesystem@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/support@0.15.0

## 0.14.4

### Patch Changes

- @stackra/filesystem@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/support@0.14.4
  - @stackra/outbox@0.14.4

## 0.14.3

### Patch Changes

- @stackra/filesystem@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/support@0.14.3
  - @stackra/outbox@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/filesystem@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/outbox@0.14.2
  - @stackra/contracts@0.14.2
  - @stackra/support@0.14.2

## 0.14.1

### Patch Changes

- @stackra/filesystem@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/support@0.14.1
  - @stackra/outbox@0.14.1

## 0.14.0

### Patch Changes

- @stackra/filesystem@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/support@0.14.0
  - @stackra/outbox@0.14.0

## 0.13.0

### Patch Changes

- @stackra/filesystem@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/support@0.13.0
  - @stackra/outbox@0.13.0

## 0.12.0

### Patch Changes

- @stackra/filesystem@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/support@0.12.0
  - @stackra/outbox@0.12.0

## 0.11.1

### Patch Changes

- @stackra/filesystem@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/support@0.11.1
  - @stackra/outbox@0.11.1

## 0.11.0

### Patch Changes

- @stackra/filesystem@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/support@0.11.0
  - @stackra/outbox@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
  - @stackra/contracts@0.10.0
  - @stackra/filesystem@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/outbox@0.10.0
  - @stackra/container@0.10.0
  - @stackra/support@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [2e43c48]
- Updated dependencies [f9c825d]
  - @stackra/contracts@0.9.0
  - @stackra/container@0.9.0
  - @stackra/filesystem@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/outbox@0.9.0
  - @stackra/support@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [7dd35b3]
  - @stackra/container@0.8.0
  - @stackra/outbox@0.8.0
  - @stackra/filesystem@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/contracts@0.8.0
  - @stackra/support@0.8.0

## 0.7.1

### Patch Changes

- @stackra/filesystem@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/support@0.7.1
  - @stackra/outbox@0.7.1

## 0.7.0

### Patch Changes

- @stackra/filesystem@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/support@0.7.0
  - @stackra/outbox@0.7.0

## 0.6.1

### Patch Changes

- @stackra/filesystem@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/support@0.6.1
  - @stackra/outbox@0.6.1

## 0.6.0

### Patch Changes

- @stackra/outbox@0.6.0
  - @stackra/filesystem@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/support@0.6.0

## 0.5.1

### Patch Changes

- @stackra/outbox@0.5.1
  - @stackra/filesystem@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/support@0.5.1

## 0.5.0

### Patch Changes

- @stackra/filesystem@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/support@0.5.0
  - @stackra/outbox@0.5.0

## 0.4.0

### Patch Changes

- 8d29426: Six port `~key` brands name the member key (`data_transfer.TabularWriter`, `market_packs.PackStore`,
  `native_spotlight.DeviceSearchIndex`, …) instead of the hyphenated folder name, so `DriverName<Port>` narrows to the
  port's drivers instead of resolving to `never`.
- Updated dependencies [9c8d108]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [5fc0db7]
- Updated dependencies [58c7da9]
  - @stackra/contracts@0.4.0
  - @stackra/container@0.4.0
  - @stackra/outbox@0.4.0
  - @stackra/support@0.4.0
  - @stackra/filesystem@0.4.0
  - @stackra/errors@0.4.0

## 0.3.0

### Minor Changes

- 18ea367: Add `exportSheet`: the sheet a tenant export or backup writes for one model's records, without the classified columns the
  export does not opt in, and never a `credential` column, even opted in (ADR 0494).

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- 30c3874: The XLSX reader and writer no longer depend on exceljs, whose last release pulls uuid 8 and glob and minimatch copies
  with open advisories (STA-1736). The writer streams the OOXML parts through the package's `writeZip`; the reader
  reads the archive's central directory with `node:zlib` and parses the workbook, shared strings, styles (1900 and 1904
  dates) and sheets itself. Rows, sheet names, text cells and ISO 8601 dates are as before.
  
  The reader treats every upload as untrusted: it refuses a zip bomb (entry count, compression ratio, part and total
  inflated size), an absolute or climbing entry name, a DTD or entity declaration, XML nested too deep and a cell past
  column XFD as the new `UnreadableWorkbookError` (`unreadable_workbook`, with a `reason`). `TransferLimits` gains
  `columns` and `cellLength`, refused as `TransferLimitExceededError`. The file is held in memory, capped by
  `limits.bytes`.
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [a60f4e9]
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/filesystem@0.3.0
  - @stackra/outbox@0.3.0
  - @stackra/support@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [9085c41]
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/outbox@0.2.0
  - @stackra/filesystem@0.2.0
  - @stackra/container@0.2.0
  - @stackra/support@0.2.0

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

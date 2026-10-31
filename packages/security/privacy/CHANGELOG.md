# @stackra/privacy

## 0.2.0

### Minor Changes

- a167045: Let a user delete their own account from inside the app (App Store Review Guideline 5.1.1(v), Google Play, STA-1567).
  `@stackra/identity/node` adds `DeleteMyAccountAction` (`identity.account_deletion.request@1`, step-up `aal2`, the
  caller's own account only), `CancelAccountDeletionAction`, `ShowAccountDeletionQuery`, the hourly system job
  `EraseDueAccountsAction` and `AccountDeletionPermissions`. A deletion waits `IdentityConfig.accountDeletionGraceDays`
  (30 by default) in the new `AccountDeletions` store (`PostgresAccountDeletionsDriver` over `identity.account_deletions`,
  migration `identity.0001`; `MemoryAccountDeletionsDriver`), then the per-scope job queues privacy's `EraseSubjectAction`
  unless a legal hold names the subject (a held one is pushed back a day); `SubjectErased` then ends the provider sessions and removes
  the provider user. Events `identity.account_deletion.{scheduled,cancelled,started}.v1`. Client halves:
  `useAccountDeletion` (`./react`) and `useAccountDeletionSheet` (`./native`, with the device check), with the
  `identity.ui.account_deletion` lang keys in seven locales (`./assets/*`). `@stackra/privacy/contracts` adds the
  `SubjectHolds` port and `./node` adds its `PostgresSubjectHoldsDriver`. New dependency of identity: `@stackra/database`.

### Patch Changes

- b5141fe: Erasure reaches the analytics vendor (STA-1582). `AnalyticsDriver.erasePerson(subject)` deletes the subject's person
  and its events at the vendor: the `posthog` driver finds it by distinct id through the private API and deletes it with
  `delete_events` and `delete_recordings`, `none` deletes nothing and `memory` records the subject; any other driver
  rejects by default. `EraseAnalyticsPersonListener` (`./node`) calls it after `SubjectErased` and logs
  `analytics.erasure.erased`. New config `posthogApiHost`, `posthogProjectId` and the
  `ANALYTICS_POSTHOG_PERSONAL_API_KEY` secret (`posthogPersonalApiKey`); without them the erasure rejects instead of
  succeeding silently. The privacy README lists the analytics listener among the erasure fan-out.
- 1a9259b: The integration tier runs (STA-1570). `@stackra/vitest-config/int` adds `intTier(config)` and `INT_TESTS`
  (`src/**/__tests__/**/*.int.test.{ts,tsx}` and gen's `.stackra/tests/**/*.int.test.ts`); `servicePreset`'s `int`
  project uses the same globs. The members with `.int.test.ts` files gain `vitest.int.config.ts` and a `test:int` script,
  which the new turbo task `test:int` and the Quality Gate run on a Testcontainers Postgres.
- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [1a9259b]
- Updated dependencies [5fa1a15]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/iam@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/search@0.2.0
  - @stackra/outbox@0.2.0
  - @stackra/queue@0.2.0
  - @stackra/scheduler@0.2.0
  - @stackra/workflow@0.2.0
  - @stackra/data-transfer@0.2.0
  - @stackra/filesystem@0.2.0
  - @stackra/model@0.2.0
  - @stackra/testing@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- fb93026: Erasure fan-out, P0 part (data-layer gap gov6, ADR 0189 decision 2). @stackra/outbox adds `OutboxDriver.holding(value)`
  and `OutboxDriver.rewrite(id, data)` (memory and Postgres drivers; a custom driver must implement both) and
  `redactSubjectMessages(driver, subject, fields)`, which nulls the named fields in every held message, due, retrying or
  dead, whose payload names the subject. @stackra/search adds `SearchForgetService.forget(Model, ids)`, which drops rows
  from the search index and, for a semantic model, the vector index, and `passageIdOf`. @stackra/privacy's erasure saga
  gains a `redact` step before `shred` (its constructor now takes the `OutboxDriver`) and counts rewritten messages in
  the receipt as `outbox.message`; the new `UnindexErasedSubjectListener` removes the subject's remaining rows from search
  after `SubjectErased`.
- 0cfb47a: `@stackra/privacy` is gen-clean. `SubjectErased` is named `subject.erased`, so its wire name is
  `privacy.subject.erased.v1` (was written as `privacy.subject_erased`): a consumer switches to it. `SubjectErased.erased`
  and `EraseSubjectOutput.erased` are typed with the new `ErasedRecordsLine` shape (same fields as `ErasedRecords`).
  `SubjectPermissions` (`erase`, `export`) and `SubjectExportPermissions` (`purge`) declare the jobs' system permissions;
  the package now depends on `@stackra/iam`. `MemorySubjectSaltStoreDriver` takes no constructor argument: seed it with
  `put(subjects)`.
- a7b4dd1: Add a legal hold store for products outside Figentra OS (data-layer gap gov20): `CreateLegalHoldsMigration`
  (`privacy.legal_holds` and `privacy.legal_hold_refusals`, partitioned per tenant), `PostgresHoldRegistryDriver` (the
  `HoldRegistry` over it, holds through subject links, each refusal logged), `PlaceHoldAction`, `ReleaseHoldAction` and
  `ListHoldsQuery` with their schemas, and the `LegalHold` contracts type.
- 738ba15: New package `@stackra/privacy` (STA-1375): the `PersonalData` kind a module declares its personal data with (model,
  subject property, and each field's `ErasureMethod`: `shred`, `delete` or `anonymise`); the DSAR export job
  `ExportSubjectDataAction` with `SubjectExportService`, which writes a zip behind a signed link for
  `PrivacyConfig.exportTtlDays` (7) and `PurgeSubjectExportsAction` that deletes older zips; and the erasure saga
  `EraseSubjectWorkflow` (started by `EraseSubjectAction`) that honours `HoldRegistry` legal holds, crypto-shreds the
  subject key through the new `SubjectSaltStore` port, deletes or anonymises the rest through `PersonalDataStore`, and
  issues the receipt as `SubjectErased` plus an optional `ServiceAcked`. Targets PDPL and GDPR.
- c3ff8a7: Seal a subject's fields under that subject's own key, so an erasure that shreds them is real (gap gov2).
  `HasEncryptedFields({ subject: "userId" }, ...fields)` makes `EncryptedFieldsSubscriber` seal and open each row with
  the new `SubjectCipherResolver` port, and an erased subject's fields load as null. `@stackra/privacy` adds
  `SaltedSubjectCipherResolverDriver`, the `PostgresSubjectSaltStoreDriver` over the new `privacy.subject_salts` table
  (migration 0001, partitioned per tenant), and `unsealedShredFields`. `EraseSubjectWorkflow` now refuses to erase while
  a `Shred` field is not subject-sealed. `SubjectSaltStore` gains `find` and `obtain`, so custom drivers must implement
  both.

### Patch Changes

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
- ca89a64: Declare `HoldPermissions` (`privacy.hold.place` L2, `privacy.hold.release` L4, `privacy.hold.read` L1) for the legal
  hold actions and query, and type `ListHoldsOutput.holds` with the `LegalHoldLine` schema, so gen compiles both.
- dc490c0: `@stackra/privacy` declares `@stackra/queue` and `@stackra/scheduler`, which gen's generated registrations of its jobs
  import (gen refused the package with `generated_dependency_missing`). Its test config merges gen's
  `./.stackra/vitest.config`.
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
- Updated dependencies [0abe92d]
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
- Updated dependencies [94ae85f]
- Updated dependencies [dddbbcd]
- Updated dependencies [856995c]
- Updated dependencies [e7ee0a4]
- Updated dependencies [ca85d59]
- Updated dependencies [d72a734]
- Updated dependencies [9841d79]
- Updated dependencies [f6d1a76]
- Updated dependencies [c196bc6]
- Updated dependencies [49ab0e6]
- Updated dependencies [d156aa8]
- Updated dependencies [6d46e5e]
- Updated dependencies [2787c1e]
- Updated dependencies [38a5501]
- Updated dependencies [e0f2fc8]
- Updated dependencies [62c7ae1]
- Updated dependencies [c868bad]
- Updated dependencies [0d36f0d]
- Updated dependencies [a701ccb]
- Updated dependencies [a526605]
- Updated dependencies [da8bdbd]
- Updated dependencies [763e901]
- Updated dependencies [936fcb1]
- Updated dependencies [f11cbe8]
- Updated dependencies [f7a2d36]
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [483eb44]
- Updated dependencies [fb93026]
- Updated dependencies [3a9eb7e]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [d156aa8]
- Updated dependencies [6dd5245]
- Updated dependencies [a289662]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [20f3fe9]
- Updated dependencies [6919ebd]
- Updated dependencies [27efea7]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [67aa168]
- Updated dependencies [82a533d]
- Updated dependencies [2787c1e]
- Updated dependencies [3312ef3]
- Updated dependencies [f0c9f64]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [d5e5ff8]
- Updated dependencies [9841d79]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [c580aa4]
- Updated dependencies [7e60fa9]
- Updated dependencies [b62c042]
- Updated dependencies [e52a367]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
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
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [4ca7b80]
- Updated dependencies [6d0152d]
- Updated dependencies [1e26ab8]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [074d3e8]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [ca44233]
- Updated dependencies [fbaaba0]
- Updated dependencies [22ffbbf]
- Updated dependencies [2787c1e]
- Updated dependencies [a31d463]
- Updated dependencies [38bebd1]
- Updated dependencies [cf64395]
- Updated dependencies [158f6cf]
- Updated dependencies [1f34fad]
- Updated dependencies [d72a734]
- Updated dependencies [68ae29e]
- Updated dependencies [20f3fe9]
- Updated dependencies [2787c1e]
- Updated dependencies [3649655]
- Updated dependencies [9811f8d]
- Updated dependencies [be97996]
- Updated dependencies [41035cc]
- Updated dependencies [7055e31]
- Updated dependencies [1e3e28d]
- Updated dependencies [7e60fa9]
- Updated dependencies [d156aa8]
- Updated dependencies [02a7917]
- Updated dependencies [fdf4b94]
- Updated dependencies [3671963]
- Updated dependencies [640ae17]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [2c0ea71]
- Updated dependencies [e344058]
- Updated dependencies [2787c1e]
- Updated dependencies [a65c6bc]
- Updated dependencies [ab9cc36]
- Updated dependencies [f04fec9]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
- Updated dependencies [ad2a950]
- Updated dependencies [fc44266]
- Updated dependencies [2787c1e]
- Updated dependencies [7441e28]
- Updated dependencies [eb2572b]
  - @stackra/actions@0.1.0
  - @stackra/events@0.1.0
  - @stackra/outbox@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/data-transfer@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/search@0.1.0
  - @stackra/filesystem@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/queue@0.1.0
  - @stackra/scheduler@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0
  - @stackra/workflow@0.1.0

Written by Changesets on release; never edited by hand.

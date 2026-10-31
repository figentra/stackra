# @stackra/filesystem

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [9085c41]
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- d156aa8: Rename the `./electron` entry to `./desktop` (ADR 0345 decision 9). Import `ElectronFileSystemDriver` from
  `@stackra/filesystem/desktop`; the `ElectronFileSystem` alias is gone.
- 6dd5245: Add the `./native` entry with `ExpoFileSystemDriver` (`disk: expo`): an Expo app keeps files on the phone under
  `<documents>/<root>` through `expo-file-system`, an optional peer, with writes through a cache file so a crash never
  leaves half a file. `memory` stays the default disk, so a target without the native driver keeps files in memory.
- a289662: Add the Google Cloud Storage disk: `GcsFileSystemDriver` in `./node` (`disk: gcs`), with the `filesystem.gcs`
  settings (`bucket`, `projectId`), V4 signed temporary URLs and Application Default Credentials, for the in-country
  GCP environments of ADR 0354.
- d72a734: Add `FilesystemHealthIndicatorDriver`, the `HealthIndicator` named `filesystem` that asks the disk whether `health.path` exists, and the `health` field of `FilesystemConfig` (probe timeout `PT2S`, `critical`, `path`) (STA-1379).
- 2787c1e: Add `@stackra/filesystem`, the server disks of the programming model v3.1: the `FileSystem` port (`exists`, `read`,
  `write`, `delete`, `list`, `stat`, `url`, `temporaryUrl`) in `./contracts`, with `FileStat`, `WriteOptions` and the
  `EncoreBucket` port; `FilesystemConfig` (key `filesystem`: `disk`, `root`, `url`, `s3`) with its shipped schema
  `FilesystemConfig$`, `MemoryFileSystemDriver` and `FileNotFoundError` in `.`; `LocalFileSystemDriver` (atomic writes),
  `S3FileSystemDriver` (AWS S3, Cloudflare R2, MinIO; presigned temporary URLs; credentials from the AWS SDK chain) and
  `EncoreBucketFileSystemDriver` (no `encore.dev` import) in `./node`; and `ElectronFileSystemDriver`, also exported as
  `ElectronFileSystem`, in `./electron`. Every driver refuses a key that reaches outside the disk.
- 20f3fe9: `FileSystem` gains `move(from, to)` and `signUpload(path, { contentType, expiresIn })`, folded in from media's
  `MediaDisk` (ADR 0465). `move` reads, writes and deletes by default; the memory (map move), local (rename), S3 (copy
  and delete) and GCS (the store's move) disks override it. `signUpload` refuses by default; the memory, S3/R2 (SigV4
  PUT, content type signed, no checksum), GCS (V4 PUT, content type signed) and Encore bucket (`signedUploadUrl`) disks
  sign. New types `SignedUpload` and `UploadRequest` in `./contracts`; `EncoreBucket` gains `signedUploadUrl`, which
  gen's generated bucket driver must forward. `MemoryFileSystemDriver` gains `receive` (the store's side of a signed
  `PUT`) and serves URLs from `https://files.invalid` when `filesystem.url` is unset.
- 6919ebd: Add `FileSystem#writeStream(key, source, options)` (ADR 0413): a `ReadableStream` or async iterable of bytes or
  strings. The `s3` disk (S3, R2, MinIO) uploads in 8 MiB multipart parts and aborts on failure; every other disk buffers
  into `write`. A failing stream stores nothing.
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.

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
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
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
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

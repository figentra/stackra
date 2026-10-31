# @stackra/media

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [5fa1a15]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/iam@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/filesystem@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- f22123c: New `PaddleOcrTextExtractorDriver` (`./node`, `TextExtractor` `paddle_ocr`): OCR with Arabic through the self-hosted
  PaddleOCR service at `media.ocr.endpoint` (set per region), boxes put in logical reading order, hints outside
  `media.ocr.languages` refused. New `C2paContentCredentialsDriver` (`./node`, `ContentCredentials` `c2pa`): signs and
  reads C2PA manifests with c2pa-rs, the certificate chain and key from the secrets `MEDIA_C2PA_SIGNING_CERTIFICATE` and
  `MEDIA_C2PA_SIGNING_KEY`. New settings `media.ocr`, `media.c2pa`, `c2paSigningCertificate` and `c2paSigningKey`. New
  dependency `@contentauth/c2pa-node` (catalog `media`). Both drivers are certification pending.
- 6c05cfc: `MediaDisk.read(path)` gives the stored bytes for server-side work (memory and S3 disks; `FileNotFoundError` when
  missing). New `SharpImageTransformerDriver` (`./node`, `ImageTransformer` on sharp): EXIF orientation, fit inside the
  box without enlarging, composite `layers` (`ImageLayer`: `left`/`top` or `gravity`), re-encode without metadata. New
  `DocumentTextExtractorDriver` (`./node`, `TextExtractor`): DOCX body and PDF text layer read in process, so the file
  stays in region (R3-SO-13); it reports the language hints whose script it found. New dependencies sharp, unpdf and
  fflate (catalog `media`). Breaking for a custom `MediaDisk` driver: it must implement `read`.
- 20f3fe9: Media stores on the `FileSystem` disk of `@stackra/filesystem` (ADR 0465), so it runs on the memory, local, S3/R2, GCS
  and Encore bucket disks. Removed: the `MediaDisk` port, `MemoryMediaDiskDriver`, `S3MediaDiskDriver`, the
  `MediaObject`, `SignedUpload` and `UploadRequest` types (the last two live in `@stackra/filesystem/contracts`) and the
  `media.disk` setting (set `filesystem.disk`). `MediaLibrary` takes `FileSystem` and records each upload's bucket key
  and expiry beside it as `uploads/<id>.json` instead of signed metadata, so a disk that signs no metadata works; a claim
  of an upload signed before this change is refused as incomplete. `fakeUpload` needs the memory `FileSystem` disk.
- 2787c1e: Add `@stackra/media`: the `Bucket` kind with `BucketVisibility`, `MediaType` and `ImageFormat`; signed direct uploads
  that `MediaLibrary` issues and claims into a bucket (the `Upload` token, refused when foreign, expired, incomplete or
  outside the bucket's rules); the `MediaDisk` port with its memory and S3/R2 drivers; the `Uploader` port with its memory
  and HTTP drivers; `MediaConfig`; the `media.upload.create@1` action in `./node`; `useUpload` and `useImageVariant` in
  `./react`; and `fakeUpload` in `./testing`.
- 1785c8c: Add the `FileScanner` port with `ScanVerdict` and the `memory` (EICAR), `clamav` (clamd `INSTREAM`) and `guard_duty`
  (GuardDuty Malware Protection tag) drivers, chosen by the new `media.scanner` and `media.clamav` settings (ADR 0354).
  Add the `ImageTransformer`, `TextExtractor` (Arabic-capable OCR) and `ContentCredentials` (C2PA) ports in
  `./contracts`.

### Patch Changes

- ae3d280: Add the `@stackra/config/contracts` entry and move the `SecretStore` port into it (one symbol, one entry): import it from
  `@stackra/config/contracts`; `@stackra/config` no longer exports it. Dependants import from the new entry.
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
- Updated dependencies [e7ee0a4]
- Updated dependencies [a701ccb]
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
- Updated dependencies [6f2c1f7]
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
- Updated dependencies [074d3e8]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [ca44233]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/filesystem@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

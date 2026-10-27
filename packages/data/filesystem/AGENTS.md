# AGENTS — @stackra/filesystem

Server disks behind the `FileSystem` port. Member at `packages/data/filesystem` (`tier:lib`), in the programming model
v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./node`, `./desktop`.

## Where code goes

| You are writing…                         | It goes in…                                      |
| ---------------------------------------- | ------------------------------------------------ |
| The port or a port type                  | `src/contracts/{ports,types}/`                   |
| A helper the port itself needs           | `src/contracts/functions/` (not re-exported)     |
| The configuration                        | `src/config/filesystem.config.ts`                |
| A bundle-safe driver (no `node:*`)       | `src/core/drivers/<name>.driver.ts`              |
| A driver that needs Node or the AWS SDK  | `src/node/drivers/<name>.driver.ts`              |
| The Electron driver                      | `src/desktop/drivers/`                           |
| A function, a constant, a schema, errors | `src/core/{functions,constants,schemas,errors}/` |
| A test                                   | `__tests__/<name>.<kind>.test.ts` beside it      |

## Entries and barrels

- `src/{core,contracts,node,desktop}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel.
- `./contracts` imports no other entry; `.` stays bundle-safe; only `./node` imports `node:*` or `@aws-sdk/*`, only
  `./desktop` imports `electron`.

## This package

- Every driver normalises keys through the one shared function: `..`, a backslash or a NUL is a `RangeError`.
- No credential is configuration: the S3 driver uses the SDK's default chain, the GCS driver Application Default
  Credentials; the Encore driver imports no
  `encore.dev` and drives the `EncoreBucket` slice the generated app binds.
- `writeStream` buffers into `write` by default (the port's own method); a driver overrides it only when its store
  uploads in parts (S3/R2 multipart, ADR 0413). Never leave a partly written object behind.
- `readStream` reads `read` into one chunk by default; a driver overrides it when its store streams (local and
  Electron file handles, the S3 GET body, the GCS download). It settles only after the file is found, so not-found
  rejects the call, never the stream.
- `move` and `signUpload` (folded in from media's `MediaDisk`, ADR 0465, stackra-226) are implemented port members:
  `move` reads, writes and deletes by default, `signUpload` refuses with a `TypeError`. A driver overrides `move` when
  its store moves (memory, local rename, S3 copy and delete, GCS move) and `signUpload` when it can sign a `PUT` (memory,
  S3, GCS, Encore). A signed upload signs the content type where the store can, never the size. `EncoreBucket` gained
  `signedUploadUrl`; gen's generated bucket driver must forward it.
- The memory disk's `url` falls back to `https://files.invalid` when `filesystem.url` is unset, so tests that upload and
  claim run on the default config; every other disk refuses without it.
- One disk per member; named disks and tenant file records belong elsewhere (README, "Not here"). Upload rules
  (buckets, accepted types, claims) are `@stackra/media`'s, on top of `signUpload` and `move`.
- `FilesystemHealthIndicatorDriver` is the `HealthIndicator` driver: it asks the disk whether `health.path` exists (a missing path is an answer), bounded by `health.timeout`; `health.critical: false` reports `degraded` instead of `down`. It reports the error's name, never its message.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

| Data          | Where           | Handling                                                                          |
| ------------- | --------------- | --------------------------------------------------------------------------------- |
| File contents | the chosen disk | Whatever the caller writes; this package never logs or inspects contents or keys. |

---
"@stackra/media": minor
"@stackra/gen": patch
---

`MediaLibrary` now enforces the ADR 0222 scan gate: an unscanned file is never served. `claim` and `store` place a
file at its bucket path only after the `FileScanner` that `media.scanner` picks called it clean while it waited under
`uploads/`. An infected file is deleted and refused (`UploadRejectedError` reason `malware`), as is one the scanner
cannot scan (`unscannable`). A pending verdict (GuardDuty before it has tagged the object) keeps the file unplaced and
raises the retryable `ScanPendingError`, so the same claim succeeds later; a `store` that waits becomes an upload into
the bucket that `claim({ id: error.upload }, bucket)` finishes, retention included. `MediaFile` gains `scan`
(`clean` for every file the library places), and `temporaryUrl` links only a clean record: a record stored before
this change is scanned on its first link and refused with `ScanPendingError` or the new `FileBlockedError` when it
is not clean.

The `memory` scanner (the default, which finds only the EICAR test file) is refused outside `dev` and `test`:
`MediaConfig` gains `environment`, read from `STACKRA_ENVIRONMENT` in the runtime only through the one environment
reader of `@stackra/config` (a runway or test value for it fails boot), and a `preview`, `staging` or `production`
boot with `media.scanner: memory` fails with `ConfigInvalidError` on `scanner`. Set `config.media.scanner` to
`guard_duty` or `clamav` for each deployed environment in runway before upgrading. The `guard_duty` scanner now pins
GuardDuty's verdict to the bytes the library places: it reads the tag of the object version it heads, and a clean tag
counts only when that object (by `VersionId`, else `If-Match` on its ETag) holds the caller's bytes; otherwise the
verdict is `pending` and the next claim reads the object anew. Its role needs `s3:GetObject` besides
`s3:GetObjectTagging` (and the version permissions on a versioned bucket).

Breaking for code that builds `MediaLibrary` by hand: its constructor takes the scanner as a fourth argument
(`new MediaLibrary(disk, config, clock, new MemoryFileScannerDriver())` in a test). Gen's wiring binds it
(`PLATFORM_BINDINGS` now lists `FileScanner`), with the memory scanner under `.useDrivers("memory")`. Record the
returned `MediaFile` with its `scan`, and let the CDN serve `public/*` only, never `uploads/*`.

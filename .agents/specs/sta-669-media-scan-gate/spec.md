# Feature Specification: MediaLibrary scans every file before it places or links it

**Feature Branch**: `figentra/sta-669-media-scan-gate`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: CTO (Idris), whose verdict of 2026-11-26 sent stackra#1094 back

**Linear**: STA-669

**Clarifications status**: complete

**Input**: ADR 0222 says an unscanned file is never served, and its Enforcement line said "planned". `MediaLibrary.claim`,
`store` and `temporaryUrl` never called the `FileScanner` port, so a file one user uploaded could reach a served path
(`public/…`, `private/…`) and be linked to others without a malware scan. This spec puts the scan gate in front of
every file `MediaLibrary` places or links, and records the public contract that changes with it.

The CTO's verdict on stackra#1094 (2026-11-26) asked for two more changes, built here: the `media.scanner` default
`memory` marks every file but the EICAR test file clean, so it is refused outside `dev` and `test` at boot through the
one environment reader of STA-2844 (merged as stackra#1166); and the `guard_duty` scanner checks the object's version or
ETag, so GuardDuty's clean tag on other bytes than the ones the library places never counts.

### Sources

- `packages/data/media/src/core/services/media-library.service.ts` (the gate in `claim`, `store`, `temporaryUrl`)
- `packages/data/media/src/contracts/ports/file-scanner.port.ts` and `src/contracts/enums/scan-verdict.enum.ts` (the
  port and the four verdicts the gate reads)
- `packages/data/media/src/core/types/media-file.type.ts`, `src/core/errors/*.error.ts`, `stackra.manifest.json`
- `packages/developer/gen/src/core/constants/platform-bindings.constant.ts` (the generated wiring)
- ADR 0222 (decision 2 and the consequence "an unscanned file is never served"), ADR 0354 (the scanner per cloud), ADR
  0140 (error envelope and kinds), ADR 0294 (decisions 16, 17 and 20), ADR 0465 (one object-storage port)
- The review notes on stackra-inc/stackra#1094 (the `memory` scanner default, the GuardDuty bucket wiring)
- The CTO's verdict of 2026-11-26 on stackra#1094 (refuse the memory scanner outside dev and test through the STA-2844
  reader; for `guard_duty`, check the object's version or ETag)
- `packages/data/media/src/config/media.config.ts`, `src/core/constants/media-config-schema.constant.ts`,
  `src/core/schemas/media-options.schema.ts` (the boot refusal), `src/node/drivers/guard-duty-file-scanner.driver.ts`
  (the pinned verdict); `@stackra/config`'s `readEnvironment`, `isDeployedEnvironment` and `StackraEnvironment`
  (STA-2844); ADR 0266 (decision 2) and ADR 0296 (amendment 2026-11-26)
- FR-001 to FR-011 come from these sources; nothing was asked of the owner.

## Impact

- **Apps touched**: apps/docs (ADR 0222's Enforcement line only)
- **Services touched**: none (no committed service builds `MediaLibrary` by hand; generated wiring picks up the new
  constructor token on the next `stackra gen`)
- **Packages touched**: packages/data/media (the gate, `MediaFile.scan`, two new errors, a widened refusal reason, the
  manifest, an integration test tier); packages/developer/gen (`PLATFORM_BINDINGS` gains the scanner token);
  packages/design-system/branding (tests build `MediaLibrary` with a scanner)
- **Public contract change**: breaking for hand-built callers: `MediaLibrary`'s constructor takes `FileScanner` as a
  fourth argument; `MediaFile` gains the required `scan: ScanVerdict`; `UploadRejectedError.reason` widens with
  `malware` and `unscannable`; `temporaryUrl` becomes `async`, accepts `Pick<MediaFile, "id" | "path">` plus an optional
  `scan`, and can now refuse; new exported errors `FileBlockedError` (`file_blocked`) and `ScanPendingError`
  (`scan_pending`); the manifest lists both errors and the fourth service dependency. `MediaConfig` (and
  `MediaOptions`, `MediaConfig$`) gains `environment: StackraEnvironment`, mapped to `STACKRA_ENVIRONMENT` and
  runtime-only (a new `env` row in the manifest); a deployed environment (`preview`, `staging`, `production`) with
  `scanner: memory` now fails boot with `ConfigInvalidError`. The `guard_duty` scanner sends `HeadObject` and
  `GetObject` besides `GetObjectTagging`, so its role needs `s3:GetObject` (and `s3:GetObjectVersion`,
  `s3:GetObjectVersionTagging` on a versioned bucket)
- **Cross-service events**: none
- **Tenancy and data**: no table; the staged upload record `uploads/<id>.json` gains an optional `retainUntil` (read
  back tolerantly, so records written before the change still parse)
- **Security and privacy**: closes a fail-open: an unscanned or infected file is no longer placed at a served path or
  linked; error details never carry the threat name, the path or the file. Closes two more: a deployment can no longer
  run the memory scanner that calls everything clean, and GuardDuty's clean tag on a later write of the key (a second
  `PUT` through the still-valid signed URL) no longer clears the bytes the claim read
- **Secrets**: none
- **ADR needed**: no (implements ADR 0222 decision 2 and its consequence as written; ADR 0222's Enforcement line is
  updated from "planned")
- **New dependencies**: `testcontainers` (dev only, from the catalog) for the clamd and S3 integration tests; the
  `localstack/localstack:4.4.0` test image (an S3 API for the `guard_duty` integration test, no account)
- **Deploy modes**: same in all three; the scanner differs per environment through `media.scanner` (ADR 0354), and
  every deployed environment must name `guard_duty` or `clamav` in runway
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: packages/data/media/README.md (the gate, the memory refusal, the pinned GuardDuty verdict and its
  permissions), packages/data/media/AGENTS.md, ADR 0222 Enforcement, the changeset (upgrade step: set
  `config.media.scanner` per deployed environment)
- **Lane**: full
- **Change risk**: R3 (a security control on file serving, a constructor and type change every hand-built caller
  must follow, and a boot that refuses what it used to accept)

## Glossary

- **Served path**: a `FileSystem` key under `public/` or `private/`; the CDN serves `public/*`, `temporaryUrl` links
  `private/*`. Nothing serves `uploads/*`.
- **Staged upload**: bytes under `uploads/<id>` with the server's record `uploads/<id>.json` (bucket key, expiry,
  optional retention).
- **Verdict**: one `ScanVerdict` the `FileScanner` returns: `clean`, `infected`, `pending`, `failed`.

## User Scenarios & Testing

### User Story 1 - A claimed upload reaches its bucket only when clean (Priority: P1)

A client puts bytes through a signed URL; the service claims the upload. The file is scanned where it waits under
`uploads/`, and only a clean file is written to its bucket path.

**Why this priority**: the claim is the path every user upload takes to a served path.

**Independent Test**: `media-library.service.test.ts` ("MediaLibrary scan gate (ADR 0222)", claim cases) with a memory
scanner set to each verdict.

**Acceptance Scenarios**:

1. **Given** a staged upload the scanner calls clean, **When** it is claimed, **Then** the scanned bytes are written to
   `<visibility>/<bucket>/<id>.<ext>`, the staged file and record are deleted, and the result has `scan: "clean"`.
2. **Given** a staged upload the scanner calls infected or failed, **When** it is claimed, **Then** the file and record
   are deleted and `UploadRejectedError` is raised with reason `malware` or `unscannable`.
3. **Given** a staged upload the scanner calls pending, **When** it is claimed, **Then** nothing is placed, the upload
   is kept and `ScanPendingError` carries the upload id; the same claim succeeds once the verdict is clean.
4. **Given** a scanner that cannot be reached, **When** the upload is claimed, **Then** the call throws and the upload
   is kept.

### User Story 2 - Bytes the server stores are scanned first (Priority: P1)

A service stores bytes it made (a PDF, an image). They wait under `uploads/` while scanned and reach the bucket path
only when clean.

**Why this priority**: server-made files can still carry user content (a rendered upload, an attachment).

**Independent Test**: the store cases of the same suite.

**Acceptance Scenarios**:

1. **Given** clean bytes, **When** stored, **Then** they are written to the bucket path and the staged copy deleted.
2. **Given** infected or unscannable bytes, **When** stored, **Then** nothing is kept and `UploadRejectedError` is
   raised.
3. **Given** a pending verdict, **When** stored, **Then** the bytes stay staged as an upload into the bucket with their
   retention, `ScanPendingError` names it, and `claim({ id }, bucket)` later writes it with that retention.

### User Story 3 - Only a clean file is linked (Priority: P1)

A service asks for a temporary URL to a private file. A record that says clean is linked at once; a record without a
verdict (stored before the gate) is scanned first.

**Why this priority**: files stored before this change were never scanned.

**Independent Test**: the `temporaryUrl` cases of the same suite and the clamd integration test.

**Acceptance Scenarios**:

1. **Given** a record with `scan: "clean"`, **When** linked, **Then** no scan runs and a URL is returned.
2. **Given** a record without `scan` whose file is clean, **When** linked, **Then** it is scanned and linked.
3. **Given** a record without `scan` whose file is infected, **When** linked, **Then** `FileBlockedError` (`malware`)
   is raised and the file is left in place.

### User Story 4 - A deployment never runs the memory scanner (Priority: P1)

An operator deploys a service with `@stackra/media` to staging without setting `config.media.scanner`. Boot fails and
names the field, instead of the memory scanner calling every upload clean.

**Why this priority**: the memory scanner's `clean` is stored on the record, so files it passed are served for good.

**Independent Test**: `media.config.test.ts` and `media-config-schema.constant.test.ts` (the refusal cases).

**Acceptance Scenarios**:

1. **Given** `STACKRA_ENVIRONMENT` is `preview`, `staging` or `production` in the runtime and `media.scanner` is
   `memory`, **When** `MediaConfig` is built at boot, **Then** it fails with `ConfigInvalidError` on `scanner`, naming
   the environment and `config.media.scanner`.
2. **Given** the same environment with `guard_duty` or `clamav`, **When** built, **Then** it boots.
3. **Given** `dev`, `test` or no variable, **When** built with `memory`, **Then** it boots.
4. **Given** a runway or test value for `environment`, **When** built, **Then** it fails: the environment comes from the
   runtime only (STA-2844).

### User Story 5 - GuardDuty's verdict covers the bytes placed (Priority: P1)

A client uploads one file, the service claims it, and before the scan the client puts other bytes through the still
valid signed URL, which GuardDuty tags clean. The claim places nothing; claimed again, it places the bytes GuardDuty
tagged.

**Why this priority**: GuardDuty tags an object version, while the claim holds the bytes it read earlier; reading only
the latest tag would clear unscanned bytes.

**Independent Test**: `guard-duty-file-scanner.driver.test.ts` and, on a real S3 API (LocalStack),
`guard-duty-file-scanner.driver.int.test.ts`.

**Acceptance Scenarios**:

1. **Given** a versioned bucket and a clean tag on the version the head sees, **When** that version holds the caller's
   bytes, **Then** the verdict is `clean`.
2. **Given** a clean tag on a later version (or, unversioned, on an object whose bytes differ from the caller's),
   **When** scanned, **Then** the verdict is `pending`.
3. **Given** an unversioned key written again between the head and the read-back (`If-Match` fails, or the same ETag
   with another last write), **When** scanned, **Then** the verdict is `pending`.

### Edge Cases

- **EC-01**: The object is replaced through the still-valid signed URL while the scan runs: the claim writes the bytes
  it checked and scanned, never the object now at `uploads/<id>`.
- **EC-02**: The object is replaced after its stat with a larger one: the size is checked again on the bytes read and
  refused (`size`).
- **EC-03**: A pending `store` whose scan outlasts `uploadExpiresIn`: its later claim is refused `UploadExpiredError`
  like any expired upload, and the staged bytes are cleaned by the bucket's `uploads/` lifecycle.
- **EC-04**: An upload record written before this change (no `retainUntil`) still parses.
- **EC-05**: A misspelt `STACKRA_ENVIRONMENT` (`prod`) fails boot on `environment`; it never reads as `dev`.
- **EC-06**: An unversioned key written again with identical bytes keeps its ETag; the read-back's last write differs,
  so the verdict is `pending` (one more claim), never a tag of an object the head did not see.

## Requirements

### Functional Requirements

- **FR-001**: THE `MediaLibrary` constructor SHALL take the `FileScanner` that `media.scanner` selects as its fourth
  argument, and THE gen platform bindings SHALL list `FileScanner` for `@stackra/media#MediaLibrary`.
- **FR-002**: WHEN `claim` or `store` has a file that passed the bucket's media type, size and content rules THE
  `MediaLibrary` SHALL scan it under `uploads/` and write it to its bucket path only when the verdict is `clean`.
- **FR-003**: IF the verdict is `infected` or `failed` THEN THE `MediaLibrary` SHALL delete the staged file and its
  record and raise `UploadRejectedError` with reason `malware` or `unscannable`.
- **FR-004**: IF the verdict is `pending` THEN THE `MediaLibrary` SHALL keep the file unplaced under `uploads/` with its
  record (a `store` writes one, keeping `retainUntil`) and raise the retryable `ScanPendingError` naming the upload id.
- **FR-005**: IF the scanner cannot be reached THEN THE `MediaLibrary` SHALL rethrow, keep a claimed upload, and keep
  nothing of a store.
- **FR-006**: THE `claim` SHALL write the exact bytes it checked and scanned to the bucket path and check their size
  again, rather than moving the staged object.
- **FR-007**: THE `MediaFile` type SHALL carry `scan`, set to `clean` on every file `claim` and `store` return.
- **FR-008**: WHEN `temporaryUrl` is asked for a record whose `scan` is not `clean` THE `MediaLibrary` SHALL scan the
  file first and link it only when clean, raising `ScanPendingError` for `pending` and `FileBlockedError` for `infected`
  or `failed`.

- **FR-009**: THE `MediaConfig` SHALL carry `environment`, mapped to `STACKRA_ENVIRONMENT` and typed by the closed
  `StackraEnvironment` list of `@stackra/config`, so its value comes from the runtime only (STA-2844).
- **FR-010**: IF `media.scanner` is `memory` and `isDeployedEnvironment(environment)` is true THEN THE `MediaConfig`
  schema SHALL refuse the configuration with an issue on `scanner`, so boot fails.
- **FR-011**: WHEN the `guard_duty` scanner reads a `NO_THREATS_FOUND` tag THE driver SHALL call the file `clean` only
  if the tagged object, pinned by `VersionId` or else by `If-Match` on its ETag and the same last write, holds exactly
  the caller's bytes, and SHALL answer `pending` otherwise.

### Key Entities

- **MediaFile**: `id`, `bucket`, `path`, `url`, `mediaType`, `size`, and now `scan`.
- **Upload record** (`uploads/<id>.json`): `bucket`, `expires`, optional `retainUntil`.
- **FileBlockedError**: kind `FailedPrecondition`, code `file_blocked`, not retryable, detail `reason`.
- **ScanPendingError**: kind `Unavailable`, code `scan_pending`, retryable, detail `upload`.

## Acceptance criteria

- **AC-001**: WHEN a staged upload is claimed and the scanner calls it clean THE `MediaLibrary` SHALL write the scanned
  bytes to the bucket path, delete the staged file and record, and return `scan: "clean"`.
- **AC-002**: IF a claimed or stored file is infected or unscannable THEN THE `MediaLibrary` SHALL keep nothing of it
  at a served path and raise `UploadRejectedError` with reason `malware` or `unscannable`.
- **AC-003**: IF the verdict is pending THEN THE `MediaLibrary` SHALL place nothing, raise `ScanPendingError` with the
  upload id, and a later claim of that id SHALL place the file, with the stored retention for a `store`.
- **AC-004**: IF the scanner cannot be reached THEN THE `MediaLibrary` SHALL throw and keep a claimed upload staged.
- **AC-005**: WHEN the staged object is replaced while the scan runs THE `MediaLibrary` SHALL place the bytes it
  scanned.
- **AC-006**: WHEN `temporaryUrl` gets a record without a clean verdict THE `MediaLibrary` SHALL scan the file and
  refuse an infected one with `FileBlockedError`, leaving it in place, and SHALL link a clean one.
- **AC-007**: THE generated wiring SHALL inject the `FileScanner` selected by `media.scanner` into `MediaLibrary`.
- **AC-008**: WHEN the `clamav` scanner runs against a real clamd THE gate SHALL claim a clean upload and refuse an
  EICAR one before it reaches a served path.

- **AC-009**: IF a deployed environment keeps `media.scanner: memory` THEN THE `MediaConfig` SHALL fail to build
  with `ConfigInvalidError` on `scanner` (`STACKRA_ENVIRONMENT` `preview`, `staging` or `production`).
- **AC-010**: IF a value sets `MediaConfig.environment` THEN THE `MediaConfig` SHALL fail to build, and a name outside
  the closed list SHALL fail it too.
- **AC-011**: WHEN a clean tag sits on other bytes than the caller's THE `guard_duty` scanner SHALL answer `pending`,
  so `MediaLibrary.claim` places nothing.

## Success Criteria

- **SC-001**: The scan-gate cases in `media-library.service.test.ts` pass and fail when the gate is reverted —
  verified by: unit
- **SC-002**: The clamd integration suite passes on a Testcontainers `clamav/clamav:1.4` — verified by: integration
- **SC-003**: The touched members' typecheck, lint, format and tests pass on the box — verified by: manual (box log)
- **SC-004**: The refusal cases fail when the schema's refinement is reverted, and the `guard_duty` cases (unit and
  LocalStack) fail on the driver as it was — verified by: unit and integration

## Compatibility and migration

- Code that builds `MediaLibrary` by hand passes a scanner: `new MemoryFileScannerDriver()` in a test, the configured
  driver elsewhere. Generated wiring needs only `stackra gen`.
- Code that builds a `MediaFile` literal adds `scan`. Records persisted before the change have no `scan`;
  `temporaryUrl` accepts them and scans on first link.
- Callers of `temporaryUrl` already await it; they now handle `ScanPendingError` (retry later) and `FileBlockedError`.
- An exhaustive `switch` over `UploadRejectedError.reason` adds `malware` and `unscannable`.
- The CDN must serve `public/*` only, never `uploads/*` (already the ADR 0222 key layout).
- Before upgrading, set `config.media.scanner` to `guard_duty` or `clamav` in runway for every deployed environment;
  until then the deployment's boot fails on `scanner`. Give the `guard_duty` role `s3:GetObject` (and the version
  permissions on a versioned bucket).

## Risks

- Files a deployment's memory scanner already passed before this change keep their stored `clean`; re-scanning them
  is the owning service's job (the refusal stops new ones).
- In an unversioned bucket the pin is the ETag and the last write (one-second resolution): a tag read can only belong
  to another write if GuardDuty scanned and tagged it between two requests; turn versioning on to pin by version.
- The `guard_duty` driver depends on the infrastructure package turning malware protection on for the files bucket;
  that wiring is a follow-up.
- `claim` now reads the whole staged file into memory (bounded by the bucket's `maxBytes`), and linking a pre-gate
  record reads it once for the scan.

## Out of scope

- Scanning tus (resumable) uploads; the key layout checked by storage tests (both still planned in ADR 0222).
- Quarantine or notification policy for a blocked file: the owning service decides.

## Assumptions

- `FileScanner` drivers return `failed` rather than throwing for a file they cannot scan, and throw only when
  unreachable (the port's documented boundary).

## Amendments

- 2026-11-27: the CTO's verdict of 2026-11-26 adds FR-009 to FR-011, AC-009 to AC-011, User Stories 4 and 5, EC-05,
  EC-06 and SC-004; the memory-default risk is closed by FR-010.

## Status history

- 2026-11-26 → Draft (from STA-669 and the diff on the branch)
- 2026-11-26 → Clarified (no open question: every answer comes from ADR 0222, ADR 0354 and the code)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md; built on the same branch)
- 2026-11-27 → Implementing (built in this branch, with the CTO's changes of 2026-11-26 on the STA-2844 reader;
  awaiting the CTO's approval)

# Feature Specification: MediaLibrary scans every file before it places or links it

**Feature Branch**: `figentra/sta-669-media-scan-gate`

**Created**: 2026-11-26

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-669

**Clarifications status**: complete

**Input**: ADR 0222 says an unscanned file is never served, and its Enforcement line said "planned". `MediaLibrary.claim`,
`store` and `temporaryUrl` never called the `FileScanner` port, so a file one user uploaded could reach a served path
(`public/…`, `private/…`) and be linked to others without a malware scan. This spec puts the scan gate in front of
every file `MediaLibrary` places or links, and records the public contract that changes with it.

### Sources

- `packages/data/media/src/core/services/media-library.service.ts` (the gate in `claim`, `store`, `temporaryUrl`)
- `packages/data/media/src/contracts/ports/file-scanner.port.ts` and `src/contracts/enums/scan-verdict.enum.ts` (the
  port and the four verdicts the gate reads)
- `packages/data/media/src/core/types/media-file.type.ts`, `src/core/errors/*.error.ts`, `stackra.manifest.json`
- `packages/developer/gen/src/core/constants/platform-bindings.constant.ts` (the generated wiring)
- ADR 0222 (decision 2 and the consequence "an unscanned file is never served"), ADR 0354 (the scanner per cloud), ADR
  0140 (error envelope and kinds), ADR 0294 (decisions 16, 17 and 20), ADR 0465 (one object-storage port)
- The review notes on stackra-inc/stackra#1094 (the `memory` scanner default, the GuardDuty bucket wiring)
- FR-001 to FR-008 come from these sources; nothing was asked of the owner.

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
  (`scan_pending`); the manifest lists both errors and the fourth service dependency
- **Cross-service events**: none
- **Tenancy and data**: no table; the staged upload record `uploads/<id>.json` gains an optional `retainUntil` (read
  back tolerantly, so records written before the change still parse)
- **Security and privacy**: closes a fail-open: an unscanned or infected file is no longer placed at a served path or
  linked; error details never carry the threat name, the path or the file
- **Secrets**: none
- **ADR needed**: no (implements ADR 0222 decision 2 and its consequence as written; ADR 0222's Enforcement line is
  updated from "planned")
- **New dependencies**: `testcontainers` (dev only, from the catalog) for the clamd integration test
- **Deploy modes**: same in all three; the scanner differs per environment through `media.scanner` (ADR 0354)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: packages/data/media/README.md, packages/data/media/AGENTS.md, ADR 0222 Enforcement, the changeset
- **Lane**: full
- **Change risk**: R3 (a security control on file serving, and a constructor and type change every hand-built caller
  must follow)

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

### Edge Cases

- **EC-01**: The object is replaced through the still-valid signed URL while the scan runs: the claim writes the bytes
  it checked and scanned, never the object now at `uploads/<id>`.
- **EC-02**: The object is replaced after its stat with a larger one: the size is checked again on the bytes read and
  refused (`size`).
- **EC-03**: A pending `store` whose scan outlasts `uploadExpiresIn`: its later claim is refused `UploadExpiredError`
  like any expired upload, and the staged bytes are cleaned by the bucket's `uploads/` lifecycle.
- **EC-04**: An upload record written before this change (no `retainUntil`) still parses.

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

## Success Criteria

- **SC-001**: The scan-gate cases in `media-library.service.test.ts` pass and fail when the gate is reverted —
  verified by: unit
- **SC-002**: The clamd integration suite passes on a Testcontainers `clamav/clamav:1.4` — verified by: integration
- **SC-003**: The touched members' typecheck, lint, format and tests pass on the box — verified by: manual (box log)

## Compatibility and migration

- Code that builds `MediaLibrary` by hand passes a scanner: `new MemoryFileScannerDriver()` in a test, the configured
  driver elsewhere. Generated wiring needs only `stackra gen`.
- Code that builds a `MediaFile` literal adds `scan`. Records persisted before the change have no `scan`;
  `temporaryUrl` accepts them and scans on first link.
- Callers of `temporaryUrl` already await it; they now handle `ScanPendingError` (retry later) and `FileBlockedError`.
- An exhaustive `switch` over `UploadRejectedError.reason` adds `malware` and `unscannable`.
- The CDN must serve `public/*` only, never `uploads/*` (already the ADR 0222 key layout).

## Risks

- `media.scanner` defaults to `memory`, which detects only EICAR; outside tests it would mark everything clean and that
  verdict is stored. Follow-up: refuse `memory` outside test and local, or re-scan memory-only verdicts.
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

None.

## Status history

- 2026-11-26 → Draft (from STA-669 and the diff on the branch)
- 2026-11-26 → Clarified (no open question: every answer comes from ADR 0222, ADR 0354 and the code)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md; built on the same branch)

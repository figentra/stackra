# Feature Specification: resumable tus uploads into a media bucket

**Feature Branch**: `figentra/sta-669-tus-uploads`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-669

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: ADR 0222 decision 2 names presigned, multipart and tus uploads, with services never streaming the bytes.
`@stackra/media` had only the signed single `PUT`: a large file (a video, a scan bundle) that loses its connection
starts over, and a file above what one request carries cannot be uploaded at all. The readiness audit (batch 19, item
19.2) found no tus implementation in `packages/**/src`.

### Sources

- `packages/data/media/src/core/services/media-library.service.ts` (the signed upload and its claim before this change)
- `packages/data/media/src/core/drivers/http-uploader.driver.ts` and `src/node/actions/create-upload.action.ts` (the
  existing client and action shapes this change mirrors)
- `packages/runtime/app/src/server/bases/controller.base.ts` (the raw `Controller` kind gen wires as an endpoint)
- ADR 0222 decision 2 (tus uploads; services never stream the bytes), ADR 0173 (secrets read blind), ADR 0294
  decisions 16, 25 and 26, ADR 0182 (test tiers)
- tusd v2.10.3: the HTTP hook protocol (`pre-create`, `ChangeFileInfo`, `RejectUpload`), its filestore and S3 store
  layouts (`<id>`, `<id>.info`, the `-s3-object-prefix`)
- FR-001 to FR-008: the PR's diff against `main` and its tests (`media-library.service.test.ts`,
  `tus-uploader.driver.test.ts`, `tus-hook.controller.test.ts`, `create-resumable-upload.action.test.ts`,
  `tus-hook.controller.int.test.ts` and the schema and index tests)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/data/media (`MediaLibrary`, `MediaOptions`, `MEDIA_CONFIG_SCHEMA`, `MEDIA_UPLOADERS`,
  `UploadRejectedError`, the `.` and `./node` barrels; new `TusUploaderDriver`, `CreateResumableUploadAction`,
  `CreateResumableUploadOutput`, `TusHookController`, `ResumableUpload`, `AdmittedUpload`, `TUS_VERSION`)
- **Public contract change**: additive. New `MediaLibrary.createResumableUpload` and `admitResumableUpload`; new
  action `media.upload.create_resumable@1` (`POST /uploads/create-resumable`) with permission
  `media.upload.create_resumable` (L2); new raw endpoint `POST /media/tus-hooks`; new `Uploader` driver `tus`; new
  `MediaConfig` fields `resumableUploadEndpoint`, `tus` and the secret `tusHookSecret` (`MEDIA_TUS_HOOK_SECRET`);
  `UploadRejectedError.reason` gains `started`. Nothing is removed or renamed; signed uploads behave as before.
- **Cross-service events**: none
- **Tenancy and data**: the upload record (`uploads/<id>.json`) now also holds the media type, the size and whether
  tusd started it, for a tus upload only. No tenant vocabulary (R-59): isolation is the unguessable upload id and the
  hook password.
- **Security and privacy**: the hook endpoint is anonymous to the adapter; its credential is the hook password (HTTP
  basic auth, compared as SHA-256 digests in constant time; empty refuses everything). The client's tus metadata is
  only a lookup key: the stored id and type come from the server's record. tusd prints its hook URL (with the
  password) once at start-up, so its output stays out of shared logs (documented).
- **Secrets**: one new secret name, `MEDIA_TUS_HOOK_SECRET`, read blind into `MediaConfig.tusHookSecret`; no value
  anywhere in the repo.
- **ADR needed**: no (implements ADR 0222 decision 2 as written; its Enforcement section is updated)
- **New dependencies**: `@stackra/app` (workspace, for the `Controller` kind) and `testcontainers` (catalog, dev only,
  for the integration tier)
- **Deploy modes**: same in all three; tusd runs beside the service in each (S3 store in SaaS, filestore or MinIO
  on-premises and air-gapped)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (`useUpload` picks the uploader from configuration)
- **Docs to update**: `packages/data/media/README.md`, `packages/data/media/AGENTS.md`, the Enforcement section of ADR
  0222, a minor changeset for `@stackra/media`
- **Lane**: full (new public API, a new endpoint and a new secret)
- **Change risk**: R1 (additive; an app opts in with `uploader: tus` and a running tusd)

## Glossary _(full lane)_

- **tus**: the open protocol for resumable uploads (`POST` to create, `PATCH` to append at an offset, `HEAD` to read
  the offset).
- **tusd**: the reference tus server; it writes the bytes to a store and calls hooks.
- **Resumable upload**: a tus upload recorded by `createResumableUpload` (`transfer: "tus"` in its record).
- **Admit**: let tusd start a recorded upload, once (`admitResumableUpload`, through the `pre-create` hook).
- **Hook password**: `MEDIA_TUS_HOOK_SECRET`, the basic-auth password tusd's hook calls carry.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A large upload survives a dropped connection (Priority: P1)

A member uploads a 3 GB video. Half-way through, the connection drops. The upload carries on from what the server
already holds, not from the start, and the action that receives the token stores the finished file in its bucket.

**Why this priority**: without it a large file restarts on every drop, and a file above one request cannot be sent.

**Independent Test**: the `tus` uploader against a real tusd, with one `PATCH` cut after half its bytes.

**Acceptance Scenarios**:

1. **Given** a recorded tus upload, **When** a `PATCH` is cut after half a chunk, **Then** the uploader asks tusd's
   offset and sends the next `PATCH` from that offset, and the upload completes.
2. **Given** a finished tus upload, **When** the action claims the token, **Then** the file is at
   `<visibility>/<bucket>/<id>.<subtype>`, byte for byte, and `uploads/` holds nothing for it.

---

### User Story 2 - Only uploads the server opened can start (Priority: P1)

An attacker who reaches tusd directly tries to start uploads the service never opened, to start one twice, to change
its size or to choose the stored type.

**Why this priority**: tusd writes into the media store; an unchecked start would let anyone fill it or plant a file
with a type the bucket does not take.

**Independent Test**: creation requests to tusd with forged metadata, and the hook controller with a memory disk.

**Acceptance Scenarios**:

1. **Given** no recorded upload, **When** a creation names an unknown id, **Then** tusd answers 404 and stores nothing.
2. **Given** a started upload, **When** a second creation names it, **Then** tusd answers 409.
3. **Given** a recorded upload of 100 bytes, **When** a creation announces 101 bytes or a deferred length, **Then**
   tusd answers 400.
4. **Given** a creation with `filetype: text/html`, **When** it is admitted, **Then** tusd stores the recorded type.

---

### User Story 3 - The hook endpoint answers only tusd (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a hook call without the password, with a wrong one, or while the password is unset, **When** it reaches
   `/media/tus-hooks`, **Then** it gets 401 and nothing is admitted; tusd then refuses the creation.

---

### User Story 4 - A claim does not destroy an upload still arriving (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a tus upload still short of its size on a local tusd store, **When** it is claimed, **Then** the claim is
   refused as incomplete and the bytes and record are kept, and a later claim succeeds.

---

### Edge Cases

- **EC-01**: A record whose media type is not a `MediaType` is not an upload (refused as incomplete at admission).
- **EC-02**: An expired upload is refused at admission (410) and at claim.
- **EC-03**: A signed `PUT` upload's id is not a tus upload: admission refuses it.
- **EC-04**: Concatenated (partial or final) tus uploads are rejected: each upload is one file of one recorded size.
- **EC-05**: A failed creation `POST` is never repeated by the uploader (a second start would be refused anyway).
- **EC-06**: Every other tusd hook type is acknowledged with no change.
- **EC-07**: A hook body above 64 KiB is refused (413) before it is parsed.
- **EC-08**: A tus upload larger than its recorded size is deleted at claim and refused.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: WHEN `createResumableUpload` is called for a bucket THE `MediaLibrary` SHALL refuse a media type or size
  the bucket does not take, and otherwise record the bucket, the media type, the size, the expiry and `started: false`
  beside `uploads/<id>` and answer the token, `media.tus.endpoint` and the start headers (`Tus-Resumable`,
  `Upload-Metadata: upload <base64 id>`).
- **FR-002**: WHEN `admitResumableUpload(id, size)` is called THE `MediaLibrary` SHALL refuse an id that is not a waiting
  tus upload (incomplete), an expired one (expired), a started one (`started`) and a size other than the recorded one
  (`size`), and otherwise mark it started and answer the id and the recorded media type.
- **FR-003**: WHEN tusd calls `POST /media/tus-hooks` THE `TusHookController` SHALL refuse it with 401 unless its basic
  password equals a non-empty `tusHookSecret`, and with 405, 413 or 400 for another method, an oversized body or a body
  that is not a tusd hook request.
- **FR-004**: WHEN the hook is `pre-create` THE `TusHookController` SHALL reject concatenated uploads, admit through
  `admitResumableUpload`, answer `ChangeFileInfo` with the admitted id and metadata `{ upload, filetype }` from the
  record, and map refusals to 404, 409, 410 and 400; every other hook type SHALL be acknowledged with no change.
- **FR-005**: WHEN `uploader` is `tus` THE `TusUploaderDriver` SHALL ask `resumableUploadEndpoint`, start the upload once
  with the given headers and the file's length, and send `PATCH`es of `tus.chunkBytes`.
- **FR-006**: IF a `PATCH` fails (network, 409, 423, 429, 460 or 5xx) THEN THE `TusUploaderDriver` SHALL pause by the
  next of `tus.retryDelaysMs`, ask the offset with `HEAD` and resume from it, resetting the pauses on progress and
  refusing with `UploadFailedError` once they run out or on any other answer or a malformed offset.
- **FR-007**: WHEN a tus upload is claimed THE `MediaLibrary` SHALL take the recorded media type, refuse as incomplete
  and keep a file shorter than the recorded size, refuse and delete a larger one, check the bytes against the type, and
  delete tusd's `uploads/<id>.info` with the record.
- **FR-008**: THE `media.upload.create_resumable@1` action SHALL expose `createResumableUpload` for users and agents on a
  registered bucket, under the permission `media.upload.create_resumable` (L2).

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a tus `PATCH` is cut mid-chunk THE `TusUploaderDriver` SHALL resume from the offset tusd reports
  and complete the upload.
- **AC-002**: WHEN a finished tus upload is claimed THE `MediaLibrary` SHALL place it at its bucket path byte for byte
  and leave nothing under `uploads/` for it.
- **AC-003**: IF a creation names an unknown, started, expired or resized upload THEN THE `TusHookController` SHALL make
  tusd reject it with 404, 409, 410 or 400.
- **AC-004**: IF a hook call does not carry the hook password THEN THE `TusHookController` SHALL answer 401 and admit
  nothing, also while the password is unset.
- **AC-005**: WHEN an upload is admitted THE `TusHookController` SHALL make tusd store it under the server's id and media
  type whatever metadata the client sent.
- **AC-006**: WHEN a tus upload still short of its size is claimed THE `MediaLibrary` SHALL refuse it as incomplete and
  keep it.

## Success Criteria _(mandatory)_

- **SC-001**: `tus-hook.controller.int.test.ts` proves AC-001 to AC-006 against a real tusd v2.10.3, and fails when the
  offset resume, the short-upload guard, the password check or the metadata replacement is reverted — verified by:
  integration
- **SC-002**: `media-library.service.test.ts`, `tus-uploader.driver.test.ts`, `tus-hook.controller.test.ts`,
  `create-resumable-upload.action.test.ts` and the schema and index tests prove FR-001 to FR-008 — verified by: unit
- **SC-003**: the `@stackra/media` tests, typecheck, oxlint, oxfmt and `stackra gen --check` pass — verified by: manual

## Compatibility and migration

- Existing apps need no change: `uploader` stays `memory` or `http`, and signed uploads and their records are read
  exactly as before (a record without `transfer` is a signed upload).
- To use tus an app runs tusd v2 against the media store (`-s3-object-prefix uploads/` on S3, R2 or MinIO;
  `-upload-dir <filesystem.root>/uploads` on a local disk), points `-hooks-http` at `/media/tus-hooks` with the
  password, enables the `pre-create` hook, sets `uploader: tus` and `tus.endpoint`, and stores `MEDIA_TUS_HOOK_SECRET`.

## Risks

- **R-1**: tusd prints its hook URL, password included, at start-up. Mitigated by the docs (keep tusd's output out of
  shared logs; rotate the secret if it leaked); a follow-up could move the password to a header once tusd supports
  static hook headers.
- **R-2**: An upload admitted but never finished keeps a multipart upload (S3) or a partial file (local) until the
  bucket's lifecycle rule removes it; the README asks for an abort-incomplete-multipart rule beside the `uploads/` one.
- **R-3**: The scan gate (STA-669 PR #1094, not merged yet) changes `claim` too; whichever lands second resolves the
  overlap so a tus upload is scanned like any other before it is placed.

## Out of scope

- Hosting tusd (an operator or runway concern).
- Scanning (the scan gate PR) and the CDN for `public/`.
- tus concatenation and deferred lengths.

## Assumptions

- tusd v2 honours `ChangeFileInfo.ID` in its filestore and S3 store (verified for the filestore on box 2 with v2.10.3).
- The media disk tusd writes to is the one `FileSystem` disk `MediaLibrary` reads.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-669 tus session) · created from the branch's diff
- 2026-11-26 · Draft → Clarified · Claude (STA-669 tus session) · clarifications complete
- 2026-11-26 · Clarified → Planned · Claude (STA-669 tus session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-669 tus session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-669 tus session) · T001 to T010 committed on the branch

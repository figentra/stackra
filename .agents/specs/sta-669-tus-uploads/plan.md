# Implementation Plan: resumable tus uploads into a media bucket

**Spec**: `.agents/specs/sta-669-tus-uploads/spec.md` · **Linear**: STA-669 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-669-tus-uploads/spec.md`

## Summary

`MediaLibrary` gains `createResumableUpload` (records a tus upload: bucket, media type, size, expiry, `started`) and
`admitResumableUpload` (lets tusd start it once with the recorded size). A raw `TusHookController` answers tusd's
`pre-create` hook behind the `MEDIA_TUS_HOOK_SECRET` password and replaces tusd's metadata from the record. The
`media.upload.create_resumable@1` action exposes the creation; the isomorphic `TusUploaderDriver` (`uploader: tus`)
sends the bytes in chunks and resumes from tusd's offset. `claim` learns the tus record: recorded type, exact size,
a short upload kept, tusd's `.info` dropped.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/data/media` (`@stackra/media`); `packages/data/filesystem` (`@stackra/filesystem`, the `s3`
  disk's move of objects above 5 GiB)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); `fetch` stubbed for the driver; the memory `FileSystem` disk
  for the library, the action and the controller; the int tier runs tusd (Testcontainers or `TUSD_BINARY`) over a
  local `FileSystem` disk
- **Storage**: the media `FileSystem` disk (`uploads/<id>`, `uploads/<id>.json`, tusd's `uploads/<id>.info`)
- **Runtime target**: isomorphic (library, driver, configuration); node (action, controller)

## Constitution Check

| Law                                   | Result | Note                                                                                |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `@stackra/media` (lib) adds `@stackra/app` (lib), which does not depend on media    |
| Secrets (ADR 0009, 0173)              | PASS   | one `@Secret` name, read blind; no value in code, tests use a memory secret store   |
| Security                              | PASS   | constant-time password check; client metadata never reaches a path or a stored type |
| HTTP and events                       | PASS   | one derived action endpoint, one raw controller in `raw/`; no events                |
| Tenancy                               | N/A    | no tenant vocabulary (R-59)                                                         |
| Delegation                            | PASS   | one session, one branch                                                             |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                              |
| Test placement (ADR 0022)             | PASS   | every test in `__tests__/` beside its subject; the int test is `.int.test.ts`       |
| Versions and catalogs                 | PASS   | `workspace:*` and `catalog:` only                                                   |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                                   |
| Licence tier (ADR 0077)               | PASS   | free                                                                                |
| Docs and ADRs                         | PASS   | README, AGENTS.md, ADR 0222 Enforcement and a changeset                             |

## Deploy modes

| Mode       | Behaviour                                                                  |
| ---------- | -------------------------------------------------------------------------- |
| SaaS       | tusd with its S3 store on the media bucket (`-s3-object-prefix uploads/`)  |
| On-prem    | tusd with MinIO, or its filestore under the local disk's `uploads/` folder |
| Air-gapped | same as on-prem; tusd is one static binary or the `tusproject/tusd` image  |

## Correctness properties

- **P-001**: for every tus upload, tusd starts it at most once, and only with the size recorded at creation — Validates: FR-002, FR-004
- **P-002**: for every admitted upload, the stored id and `filetype` equal the record's, whatever the client sent — Validates: FR-004
- **P-003**: for every hook call, admission happens only when the basic password equals a non-empty secret — Validates: FR-003
- **P-004**: for every failed `PATCH`, the next `PATCH` starts at the offset tusd reported, never at a guessed one — Validates: FR-006
- **P-005**: a claim never deletes a tus upload still short of its recorded size — Validates: FR-007
- **P-006**: for every created tus upload, its record holds the bucket, media type, size and expiry the creation checked and `started: false` before any byte moves — Validates: FR-001
- **P-007**: for every file, the uploader's `PATCH`es carry at most `tus.chunkBytes` each, in offset order, and the creation `POST` is sent once — Validates: FR-005
- **P-008**: for every call of `media.upload.create_resumable@1`, an upload is recorded only into a registered bucket that takes its media type and size — Validates: FR-008
- **P-009**: for every tus upload tusd reports finished before its expiry, the expiry afterwards is at least `uploadExpiresIn` from the report and never earlier than before — Validates: FR-009
- **P-010**: for every claim, the bytes read from the staged file are at most 64 plus one stream chunk, whatever its size — Validates: FR-010
- **P-011**: for every `s3` move of an object of n > 5 GiB bytes, the copied ranges are contiguous, equal but the last, at most 10,000, and cover bytes 0 to n − 1; a failed copy leaves the source and no multipart upload — Validates: FR-011

## Architecture overview

The record beside `uploads/<id>` gains an optional tus part (`transfer: "tus"`, `mediaType`, `size`, `started`);
`recordOf` reads both shapes and refuses a malformed tus part. The tus flow is: action → `createResumableUpload`
(record) → client `POST` to tusd → tusd `pre-create` hook → `TusHookController` → `admitResumableUpload` (mark started)
→ `ChangeFileInfo` (id, metadata) → tusd stores `uploads/<id>` → client `PATCH`es → action `claim`. The controller is
a `Controller({ path: "/media/tus-hooks" })` in `src/node/raw/`, which gen turns into a raw Encore endpoint.

## Components and responsibilities

- `MediaLibrary` (`src/core/services/media-library.service.ts`): `createResumableUpload`, `admitResumableUpload`, the
  tus-aware `claim` and a shared `admissibleKey` and `discard`.
- `TusUploaderDriver` (`src/core/drivers/tus-uploader.driver.ts`): the client: ask, start, chunk, resume.
- `TusHookController` (`src/node/raw/tus-hook.controller.ts`): the hook endpoint.
- `CreateResumableUploadAction` and `CreateResumableUploadOutput` (`src/node/actions`, `src/node/schemas`,
  `src/node/constants`): the action, reusing `CreateUploadInput`.
- `UploadPermissions.createResumable` (`src/node/access/upload.permissions.ts`).
- `MediaOptions` / `MEDIA_CONFIG_SCHEMA`: `resumableUploadEndpoint`, `tus`, `tusHookSecret`; `MEDIA_UPLOADERS` gains `tus`.
- `ResumableUpload`, `AdmittedUpload` (`src/core/types`), `TUS_VERSION` (`src/core/constants`).

## Files and folders

```text
packages/data/media/
├── AGENTS.md
├── README.md
├── package.json
├── stackra.manifest.json
├── vitest.int.config.ts
└── src/
    ├── core/
    │   ├── index.ts
    │   ├── constants/{media-config-schema,media-uploaders,tus-version}.constant.ts
    │   ├── drivers/tus-uploader.driver.ts
    │   ├── errors/{upload-rejected,upload-expired}.error.ts
    │   ├── schemas/media-options.schema.ts
    │   ├── services/media-library.service.ts
    │   └── types/{admitted-upload,resumable-upload,media-driver-names}.type.ts
    └── node/
        ├── index.ts
        ├── access/upload.permissions.ts
        ├── actions/create-resumable-upload.action.ts
        ├── constants/create-resumable-upload-output-schema.constant.ts
        ├── raw/tus-hook.controller.ts
        └── schemas/create-resumable-upload-output.schema.ts
packages/data/filesystem/
├── README.md
└── src/node/drivers/s3-file-system.driver.ts
apps/docs/src/docs/adr/0222-files-and-media-storage-drivers-uploads-scanning-and-public-assets.mdx
.changeset/media-tus-uploads.md
.changeset/filesystem-s3-large-move.md
```

- `packages/data/media/src/core/services/media-library.service.ts`
- `packages/data/media/src/core/drivers/tus-uploader.driver.ts`
- `packages/data/media/src/node/raw/tus-hook.controller.ts`
- `packages/data/media/src/node/actions/create-resumable-upload.action.ts`
- `packages/data/media/src/node/schemas/create-resumable-upload-output.schema.ts`
- `packages/data/media/src/node/constants/create-resumable-upload-output-schema.constant.ts`
- `packages/data/media/src/node/access/upload.permissions.ts`
- `packages/data/media/src/core/schemas/media-options.schema.ts`
- `packages/data/media/src/core/constants/media-config-schema.constant.ts`
- `packages/data/media/src/node/raw/__tests__/tus-hook.controller.int.test.ts`
- `packages/data/filesystem/src/node/drivers/s3-file-system.driver.ts`
- `packages/data/filesystem/src/node/drivers/__tests__/s3-file-system.driver.test.ts`

## Data models and migrations

The upload record `uploads/<id>.json` gains, for a tus upload only, `transfer: "tus"`, `mediaType`, `size` and
`started`. A record without `transfer` is read as before; no migration.

## Contracts

- `MediaLibrary.createResumableUpload(bucket, { mediaType, size }): Promise<ResumableUpload<B>>` (new).
- `MediaLibrary.admitResumableUpload(id: string, size: number | null): Promise<AdmittedUpload>` (new).
- `media.upload.create_resumable@1`: input `CreateUploadInput`, output `CreateResumableUploadOutput`
  (`upload`, `url`, `headers`, `expiresAt`), permission `media.upload.create_resumable` (L2), actors user and agent.
- `POST /media/tus-hooks`: tusd v2 HTTP hook protocol; basic auth with `MEDIA_TUS_HOOK_SECRET`.
- `MediaConfig`: `resumableUploadEndpoint` (default `/api/uploads/create-resumable`), `tus` (`endpoint` `/files/`,
  `chunkBytes` 8 MiB, `retryDelaysMs` `[0, 1000, 3000, 5000, 10000]`), `tusHookSecret` (`@Secret`).
- `UploadRejectedError.reason`: adds `started`.

## Error handling

Library refusals are the existing `UploadIncompleteError`, `UploadExpiredError` and `UploadRejectedError`. The
controller maps them to tusd rejections (404, 410, 409 or 400) with a body naming the code only; anything else
propagates to the adapter (500), and tusd fails the creation. Client failures are `UploadFailedError` (status 0 for a
network failure).

## Security and tenancy

The hook password is compared as SHA-256 digests with `timingSafeEqual`; an empty secret refuses all. The client's
metadata is a lookup key only; the stored id comes from the record and the metadata is replaced whole. tusd is run with
`-disable-download`. No tenant vocabulary.

## Testing strategy

- AC-001, AC-002, AC-005, AC-006: "admits, resumes after a dropped request, keeps a short upload and claims the
  finished file" (int, real tusd).
- AC-003: "refuses a second start of an upload, and an upload the server never opened" (int) and the controller unit
  tests (404, 409, 410, 400).
- AC-004: "starts nothing when tusd's hook password is wrong" (int) and the controller's 401 unit tests.
- FR-001, FR-002, FR-007: `media-library.service.test.ts` (createResumableUpload, admitResumableUpload, claim of a tus
  upload); FR-005, FR-006: `tus-uploader.driver.test.ts`; FR-008: `create-resumable-upload.action.test.ts`.
- Revert checks: removing the short-upload guard, the password check, the offset resume or the metadata replacement
  each fails a unit test and the int test.

## Rollout

A minor changeset for `@stackra/media`. Apps opt in with `uploader: tus` and a tusd beside the service.

## Delegation and risk plan

One session, one branch. Follow-ups: R-1 (move the password out of tusd's start-up log when tusd allows), R-3 (scan
the tus upload once the scan gate lands).

## ADRs

ADR 0222 decision 2 (tus uploads), ADR 0173 (secrets), ADR 0294 decisions 16, 25 and 26, ADR 0182 (test tiers): all
Accepted.

## Docs

`packages/data/media/README.md`, `packages/data/media/AGENTS.md`, ADR 0222 Enforcement, `.changeset/media-tus-uploads.md`,
`packages/data/filesystem/README.md`, `.changeset/filesystem-s3-large-move.md`.

## Complexity tracking

none

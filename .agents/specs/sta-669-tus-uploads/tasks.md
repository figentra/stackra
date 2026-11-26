---
description: "Tasks for STA-669: resumable tus uploads into a media bucket"
---

# Tasks: resumable tus uploads into a media bucket

**Input**: Design documents from `.agents/specs/sta-669-tus-uploads/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Configuration and record

**Goal**: `MediaConfig` carries the tus settings and the hook secret; the record knows a tus upload.

- [x] T001 Test first: the tus defaults, bounds and the `tus` driver name in `packages/data/media/src/core/constants/__tests__/media-config-schema.constant.test.ts` and `packages/data/media/src/core/schemas/__tests__/media-options.schema.test.ts` — covers: FR-005, FR-006, AC-001 — route: tests
- [x] T002 Add `resumableUploadEndpoint`, `tus`, `tusHookSecret` and the `tus` uploader in `packages/data/media/src/core/schemas/media-options.schema.ts`, `packages/data/media/src/core/constants/media-config-schema.constant.ts` and `packages/data/media/src/core/constants/media-uploaders.constant.ts`, with the driver name type in `packages/data/media/src/core/types/media-driver-names.type.ts` and the protocol version in `packages/data/media/src/core/constants/tus-version.constant.ts` — covers: FR-005, FR-006, AC-001 — route: package — deps: T001

## Phase 2: User Story 2 - Only uploads the server opened can start (Priority: P1)

**Goal**: the library records and admits tus uploads once.

**Independent Test**: `MediaLibrary` over the memory disk.

- [x] T003 [US2] Test first: createResumableUpload and admitResumableUpload in `packages/data/media/src/core/services/__tests__/media-library.service.test.ts` — covers: FR-001, FR-002, P-001, EC-01, EC-02, EC-03, AC-003 — route: tests — deps: T002
- [x] T004 [US2] Add `createResumableUpload`, `admitResumableUpload` and the tus record in `packages/data/media/src/core/services/media-library.service.ts` with `packages/data/media/src/core/types/resumable-upload.type.ts` and `packages/data/media/src/core/types/admitted-upload.type.ts`, the `started` reason in `packages/data/media/src/core/errors/upload-rejected.error.ts` and the exports in `packages/data/media/src/core/index.ts` — covers: FR-001, FR-002, P-001, P-006, AC-003 — route: package — deps: T003

## Phase 3: User Story 3 - The hook endpoint answers only tusd (Priority: P1)

- [x] T005 [US3] Test first: password, method, body, admission, rejections and other hooks in `packages/data/media/src/node/raw/__tests__/tus-hook.controller.test.ts` — covers: FR-003, FR-004, P-002, P-003, EC-04, EC-06, EC-07, AC-003, AC-004, AC-005 — route: tests — deps: T004
- [x] T006 [US3] Add `TusHookController` in `packages/data/media/src/node/raw/tus-hook.controller.ts` and the `@stackra/app` dependency in `packages/data/media/package.json` — covers: FR-003, FR-004, P-002, P-003, AC-003, AC-004, AC-005 — route: package — deps: T005

## Phase 4: User Story 1 - A large upload survives a dropped connection (Priority: P1)

- [x] T007 [US1] Test first: ask, start, chunks, resume, retries and refusals in `packages/data/media/src/core/drivers/__tests__/tus-uploader.driver.test.ts`, and the action in `packages/data/media/src/node/actions/__tests__/create-resumable-upload.action.test.ts` — covers: FR-005, FR-006, FR-008, P-004, P-007, P-008, EC-05, AC-001 — route: tests — deps: T004
- [x] T008 [US1] Add `TusUploaderDriver` in `packages/data/media/src/core/drivers/tus-uploader.driver.ts`, `CreateResumableUploadAction` in `packages/data/media/src/node/actions/create-resumable-upload.action.ts` with its output in `packages/data/media/src/node/schemas/create-resumable-upload-output.schema.ts` and `packages/data/media/src/node/constants/create-resumable-upload-output-schema.constant.ts`, its permission in `packages/data/media/src/node/access/upload.permissions.ts`, the exports in `packages/data/media/src/node/index.ts`, and run `stackra gen` for `packages/data/media/stackra.manifest.json` — covers: FR-005, FR-006, FR-008, P-004, P-007, P-008, AC-001 — route: package — deps: T007

## Phase 5: User Story 4 - A claim does not destroy an upload still arriving (Priority: P2)

- [x] T009 [US4] Test and implement the tus-aware claim (recorded type, short upload kept, larger refused, tusd's info file dropped) in `packages/data/media/src/core/services/__tests__/media-library.service.test.ts` and `packages/data/media/src/core/services/media-library.service.ts` — covers: FR-007, P-005, EC-08, AC-002, AC-006 — route: package — deps: T004

## Phase 6: Proof and polish

- [x] T010 Prove the flow on a real tusd in `packages/data/media/src/node/raw/__tests__/tus-hook.controller.int.test.ts` with `packages/data/media/vitest.int.config.ts`, and document it in `packages/data/media/README.md`, `packages/data/media/AGENTS.md`, `apps/docs/src/docs/adr/0222-files-and-media-storage-drivers-uploads-scanning-and-public-assets.mdx` and `.changeset/media-tus-uploads.md` — covers: SC-001, SC-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — route: steward-docs — deps: T006, T008, T009
- [ ] T011 Run the `@stackra/media` tests, typecheck, oxlint, oxfmt and `stackra gen --check`, then `pnpm verify`, in `packages/data/media/package.json` — covers: SC-001, SC-002, SC-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — route: verify-fix — deps: T010

## Phase 7: Review fixes (large files and long transfers)

- [x] T012 Test first, then give tus uploads their own lifetime: `resumableUploadExpiresIn` in `packages/data/media/src/core/schemas/media-options.schema.ts` and `packages/data/media/src/core/constants/media-config-schema.constant.ts` (tests in `packages/data/media/src/core/constants/__tests__/media-config-schema.constant.test.ts`), used by `createResumableUpload` in `packages/data/media/src/core/services/media-library.service.ts`, with the expiry docs in `packages/data/media/src/core/types/resumable-upload.type.ts` and `packages/data/media/src/core/errors/upload-expired.error.ts` and the action test in `packages/data/media/src/node/actions/__tests__/create-resumable-upload.action.test.ts` — covers: FR-001, EC-09, AC-007 — route: package — deps: T010
- [x] T013 Test first, then renew the claim window on tusd's `post-finish`: `finishResumableUpload` in `packages/data/media/src/core/services/media-library.service.ts` (tests in `packages/data/media/src/core/services/__tests__/media-library.service.test.ts`) and the hook in `packages/data/media/src/node/raw/tus-hook.controller.ts` (tests in `packages/data/media/src/node/raw/__tests__/tus-hook.controller.test.ts`, proof on tusd in `packages/data/media/src/node/raw/__tests__/tus-hook.controller.int.test.ts`) — covers: FR-004, FR-009, P-009, EC-10, AC-007, SC-001, SC-004 — route: package — deps: T012
- [x] T014 Test first, then read only the 64-byte head from `readStream` in a claim in `packages/data/media/src/core/services/media-library.service.ts` (test: a disk whose `read` throws for the upload, in `packages/data/media/src/core/services/__tests__/media-library.service.test.ts`) — covers: FR-010, P-010, EC-11, AC-008, SC-004 — route: package — deps: T010
- [x] T015 Test first, then copy an object above 5 GiB part by part in `packages/data/filesystem/src/node/drivers/s3-file-system.driver.ts` (tests in `packages/data/filesystem/src/node/drivers/__tests__/s3-file-system.driver.test.ts`), documented in `packages/data/filesystem/README.md`, `packages/data/media/README.md`, `.changeset/filesystem-s3-large-move.md` and `.changeset/media-tus-uploads.md` — covers: FR-011, P-011, EC-11, AC-009, SC-004 — route: package — deps: T010

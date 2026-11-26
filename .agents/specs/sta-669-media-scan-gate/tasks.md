---
description: "Tasks for STA-669: the MediaLibrary scan gate"
---

# Tasks: MediaLibrary scans every file before it places or links it

**Input**: Design documents from `.agents/specs/sta-669-media-scan-gate/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Contract

- [ ] T001 Add `scan` to `MediaFile`, the `FileBlockedError` and `ScanPendingError` refusals and the widened `UploadRejectedError` reason in `packages/data/media/src/core/types/media-file.type.ts`, `packages/data/media/src/core/errors/file-blocked.error.ts`, `packages/data/media/src/core/errors/scan-pending.error.ts` and `packages/data/media/src/core/errors/upload-rejected.error.ts` — covers: FR-003, FR-004, FR-007, FR-008, P-007, AC-002, AC-003, AC-006 — route: spec-task
- [ ] T002 Export the new errors and list them and the scanner dependency in `packages/data/media/src/core/index.ts` and `packages/data/media/stackra.manifest.json`, and name the gate in the port's purpose in `packages/data/media/src/contracts/ports/file-scanner.port.ts` — covers: FR-001, AC-007 — route: spec-task — deps: T001

## Phase 2: User Story 1 - A claimed upload reaches its bucket only when clean (Priority: P1)

**Goal**: `claim` scans under `uploads/` and places only clean bytes.

**Independent Test**: the claim cases of "MediaLibrary scan gate (ADR 0222)".

- [ ] T003 [US1] Claim cases for each verdict, an unreachable scanner and a replaced object in `packages/data/media/src/core/services/__tests__/media-library.service.test.ts` — covers: FR-002, FR-003, FR-004, FR-005, FR-006, P-001, P-002, P-003, P-004, P-005, AC-001, AC-002, AC-003, AC-004, AC-005 — route: tests — deps: T001
- [ ] T004 [US1] Inject `FileScanner` and gate `claim`, writing the scanned bytes in `packages/data/media/src/core/services/media-library.service.ts` — covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, P-001, P-005, AC-001, AC-002, AC-003, AC-004, AC-005 — route: spec-task — deps: T003

## Phase 3: User Story 2 - Bytes the server stores are scanned first (Priority: P1)

**Goal**: `store` stages, scans, and places only clean bytes; a pending store becomes a claimable upload.

**Independent Test**: the store cases of the same suite.

- [ ] T005 [US2] Store cases for each verdict, retention on a pending store and an unreachable scanner in `packages/data/media/src/core/services/__tests__/media-library.service.test.ts` — covers: FR-002, FR-003, FR-004, FR-005, P-003, P-004, AC-002, AC-003 — route: tests — deps: T004
- [ ] T006 [US2] Gate `store` and keep `retainUntil` in the upload record in `packages/data/media/src/core/services/media-library.service.ts` — covers: FR-002, FR-003, FR-004, FR-005, P-003, AC-002, AC-003 — route: spec-task — deps: T005

## Phase 4: User Story 3 - Only a clean file is linked (Priority: P1)

**Goal**: `temporaryUrl` links only clean files and scans pre-gate records.

**Independent Test**: the `temporaryUrl` cases of the same suite.

- [ ] T007 [US3] Link cases for a clean record, a pre-gate clean file and a pre-gate infected file in `packages/data/media/src/core/services/__tests__/media-library.service.test.ts` — covers: FR-008, P-006, AC-006 — route: tests — deps: T004
- [ ] T008 [US3] Gate `temporaryUrl` in `packages/data/media/src/core/services/media-library.service.ts` — covers: FR-008, P-006, AC-006 — route: spec-task — deps: T007

## Phase 5: Wiring and proof

- [ ] T009 Bind `FileScanner` for `MediaLibrary` in `packages/developer/gen/src/core/constants/platform-bindings.constant.ts` with cases in `packages/developer/gen/src/core/constants/__tests__/platform-bindings.constant.test.ts` and `packages/developer/gen/src/core/functions/__tests__/emit-wiring.function.test.ts` — covers: FR-001, AC-007 — route: gen — deps: T004
- [ ] T010 [P] Build `MediaLibrary` with a scanner in consumer tests `packages/design-system/branding/src/node/services/__tests__/brand-reader.service.test.ts`, `packages/design-system/branding/src/node/models/__tests__/brand-assets.bucket.test.ts`, `packages/data/media/src/node/actions/__tests__/create-upload.action.test.ts` and `packages/data/media/src/testing/functions/__tests__/fake-upload.function.test.ts` — covers: FR-001, AC-007 — route: tests — deps: T004
- [ ] T011 Integration tier on a real clamd in `packages/data/media/vitest.int.config.ts`, `packages/data/media/package.json` (`test:int`, `testcontainers`) and `packages/data/media/src/node/drivers/__tests__/clamav-file-scanner.driver.int.test.ts` — covers: FR-002, FR-003, FR-008, AC-008 — route: tests — deps: T008

## Phase 6: Polish

- [ ] T012 [P] Docs for the gate and its errors in `packages/data/media/README.md`, `packages/data/media/AGENTS.md` and `apps/docs/src/docs/adr/0222-files-and-media-storage-drivers-uploads-scanning-and-public-assets.mdx` — covers: SC-001, AC-006 — route: steward-docs — deps: T008
- [ ] T013 [P] Changeset (minor `@stackra/media`, patch `@stackra/gen`) in `.changeset/media-scan-gate.md` — covers: SC-003, AC-007 — route: steward-changesets — deps: T009
- [ ] T014 Box run: typecheck, lint, format, unit and integration tests for the touched members in `packages/data/media` — covers: SC-001, SC-002, SC-003, AC-008 — route: verify-fix — deps: T011, T012, T013

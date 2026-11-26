---
description: "Tasks for STA-2791: the C2PA driver says trusted only for a trusted signer"
---

# Tasks: the C2PA driver says trusted only for a trusted signer

**Input**: Design documents from `.agents/specs/sta-2791-c2pa-trusted-only/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Contracts

**Goal**: `read` speaks a reading with a trust state.

- [x] T001 Add `ContentCredentialTrust` and `ContentCredentialReading`, change `ContentCredentials.read`, export them, with their tests, in `packages/data/media/src/contracts/enums/content-credential-trust.enum.ts`, `packages/data/media/src/contracts/types/content-credential-reading.type.ts`, `packages/data/media/src/contracts/ports/content-credentials.port.ts`, `packages/data/media/src/contracts/index.ts`, `packages/data/media/src/contracts/__tests__/index.test.ts`, `packages/data/media/src/contracts/enums/__tests__/content-credential-trust.enum.test.ts`, `packages/data/media/src/contracts/ports/__tests__/text-extractor.port.test.ts` — covers: FR-001 — route: package

## Phase 2: User Stories 1, 3 - Trust from the store (Priority: P1)

- [x] T002 [US1] Test first, then `credentialTrustOf` and the store's `validation_results`, in `packages/data/media/src/node/functions/__tests__/credential-trust-of.function.test.ts`, `packages/data/media/src/node/functions/credential-trust-of.function.ts`, `packages/data/media/src/node/types/c2pa-manifest-store.type.ts` — covers: FR-002, P-001, P-004, EC-03, EC-06, AC-001, AC-003 — route: package — deps: T001

## Phase 3: User Stories 2, 4 - Anchors and signers (Priority: P1)

- [x] T003 [US4] Pin the C2PA trust list and its source, and read certificates from PEM, with tests, in `packages/data/media/src/node/constants/c2pa-trust-list.constant.ts`, `packages/data/media/src/node/constants/c2pa-trust-list-pin.constant.ts`, `packages/data/media/src/node/constants/__tests__/c2pa-trust-list.constant.test.ts`, `packages/data/media/src/node/functions/certificates-in.function.ts`, `packages/data/media/src/node/functions/__tests__/certificates-in.function.test.ts` — covers: FR-006, P-005, AC-007 — route: package
- [x] T004 [US2] Add `media.c2pa.trustedSigners` to the shape and the shipped schema, with the schema test, in `packages/data/media/src/core/schemas/media-options.schema.ts`, `packages/data/media/src/core/constants/media-config-schema.constant.ts`, `packages/data/media/src/core/constants/__tests__/media-config-schema.constant.test.ts` — covers: FR-007, AC-002 — route: package
- [x] T005 [US1] [US2] [US4] Test first, then read with the anchors and signers valid now, trust verification on, no remote fetch, and the fail-closed cap, in `packages/data/media/src/node/drivers/__tests__/c2pa-content-credentials.driver.test.ts`, `packages/data/media/src/node/drivers/c2pa-content-credentials.driver.ts`, `packages/data/media/src/node/functions/credential-of.function.ts` — covers: FR-002, FR-003, FR-004, FR-005, P-002, P-003, EC-01, EC-02, EC-04, EC-05, AC-004, AC-005, AC-006 — route: package — deps: T002, T003, T004
- [x] T006 [US1] [US2] [US3] [US4] The real-engine round trip: our signer and `trustedSigners` trusted, a self-made CA unverified, a list anchor trusted until it expires, an empty or unreadable list unverified, a changed image invalid, in `packages/data/media/src/node/drivers/__tests__/c2pa-round-trip.test.ts` with the STA-2781 fixtures `c2pa-test-certificate.fixture.ts`, `png-chunk.fixture.ts`, `test-png.fixture.ts` — covers: SC-001, AC-001, AC-002, AC-003, AC-004, AC-005 — route: tests — deps: T005

## Phase 4: Polish

- [x] T007 Document the three states, the pinned list and its update, and the break, in `packages/data/media/README.md`, `packages/data/media/AGENTS.md` and `.changeset/c2pa-read-trusted-only.md` — covers: SC-002, AC-001, AC-002 — route: steward-docs — deps: T005
- [ ] T008 Run the `@stackra/media` tests, typecheck, oxlint and oxfmt, then `pnpm verify`, in `packages/data/media/package.json` — covers: SC-001, SC-002, SC-003 — route: verify-fix — deps: T007

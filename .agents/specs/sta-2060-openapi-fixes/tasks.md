---
description: "Tasks for STA-2060: openapi.json fixes and two JSON Schema fixes in gen"
---

# Tasks: openapi.json fixes and two JSON Schema fixes in gen

**Input**: Design documents from `.agents/specs/sta-2060-openapi-fixes/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Setup

- [ ] T001 Merge origin/main into the branch and read the current `openApiOf` in `packages/developer/gen/src/core/functions/open-api-of.function.ts` — covers: FR-001, AC-001 — route: spec-task

## Phase 2: User Story 1 - A valid, honest openapi.json (Priority: P1)

**Goal**: the projection validates as OpenAPI 3.1 and states auth, idempotency and refusal statuses.

**Independent Test**: project a manifest with an authenticated write, an anonymous query and a refusal.

- [ ] T002 [US1] Tests first for root keys, `x-stackra-generated`, bearer scheme and requirement, anonymous `security: []`, Idempotency-Key required and optional and absent on GET, per-status refusals and the unknown code under `default` in `packages/developer/gen/src/core/functions/__tests__/open-api-of.function.test.ts` — covers: FR-001, FR-002, FR-003, FR-004, EC-01, EC-02, EC-03, EC-07, P-001, P-002, P-003, P-004, AC-001, AC-002, AC-003, AC-004 — route: tests — deps: T001
- [ ] T003 [US1] Change the document type: `x-stackra-generated`, `security`, `components.securitySchemes` in `packages/developer/gen/src/core/types/open-api-document.type.ts` — covers: FR-001, FR-002, AC-001, AC-002 — route: spec-task — deps: T002
- [ ] T004 [US1] Security scheme, root requirement, `x-stackra-generated`, Idempotency-Key header and per-status refusal responses from `ErrorKind` in `packages/developer/gen/src/core/functions/open-api-of.function.ts` — covers: FR-001, FR-002, FR-003, FR-004, AC-001, AC-002, AC-003, AC-004 — route: spec-task — deps: T003

## Phase 3: User Story 2 - JSON Schema matches the runtime (Priority: P2)

**Goal**: public id patterns are Crockford base32 and a shape on a remote base keeps the base's fields.

**Independent Test**: `jsonSchemaOf` of a public id field and of a remote-based shape; the decoder on both bodies.

- [ ] T005 [P] [US2] Tests first for the Crockford body (single, union, any prefix; I, L, O, U refused; both cases accepted) and for remote bases (plain, pick, omit, partial, own field wins, no manifest) in `packages/developer/gen/src/core/functions/__tests__/json-schema-of.function.test.ts` — covers: FR-005, FR-008, EC-04, EC-06, P-005, P-007, AC-005, AC-006 — route: tests — deps: T004
- [ ] T006 [P] [US2] Tests first for both bodies decoding to `publicId` in `packages/developer/gen/src/core/functions/__tests__/zod-of-json-schema.function.test.ts` — covers: FR-006, P-006, AC-005 — route: tests — deps: T004
- [ ] T007 [P] [US2] Tests first for the old-to-new body being no break and any other pattern change still a break in `packages/developer/gen/src/core/functions/__tests__/compare-manifests.function.test.ts` — covers: FR-007, P-006, AC-005 — route: tests — deps: T004
- [ ] T008 [P] [US2] Test first that a referenced producer schema is copied transitively in `packages/developer/gen/src/core/functions/__tests__/build-manifest.function.test.ts` — covers: FR-009, EC-05, P-007, AC-006 — route: tests — deps: T004
- [ ] T009 [US2] Crockford body and remote-base resolution in `packages/developer/gen/src/core/functions/json-schema-of.function.ts` — covers: FR-005, FR-008, AC-005, AC-006 — route: spec-task — deps: T005
- [ ] T010 [US2] Read both bodies in `packages/developer/gen/src/core/functions/zod-of-json-schema.function.ts` — covers: FR-006, AC-005 — route: spec-task — deps: T006, T009
- [ ] T011 [US2] Normalise the earlier body before the pattern check in `packages/developer/gen/src/core/functions/compare-manifests.function.ts` — covers: FR-007, AC-005 — route: spec-task — deps: T007, T009
- [ ] T012 [US2] Pass `ir.services` to `jsonSchemaOf` and copy referenced producer schemas in `packages/developer/gen/src/core/functions/build-manifest.function.ts` — covers: FR-008, FR-009, AC-006 — route: spec-task — deps: T008, T009

## Phase 4: Polish

- [ ] T013 Regenerate the goldens with `UPDATE_GOLDEN=1` on ci-box and review the diff in `packages/developer/gen/__golden__/service/expected/services/shop/openapi.json.golden` and its siblings — covers: SC-001, AC-001, AC-002 — route: codegen-drift — deps: T004, T012
- [ ] T014 Regenerate the committed manifests and `apps/playground/openapi.json` with `stackra gen` on ci-box, in `apps/playground/openapi.json` and each `stackra.manifest.json` holding a public id pattern — covers: SC-003, AC-005 — route: codegen-drift — deps: T013
- [ ] T015 [P] Update the `openApiOf` and public id rows in `packages/developer/gen/README.md` — covers: SC-002, AC-001 — route: steward-docs — deps: T012
- [ ] T016 [P] Add a patch changeset for `@stackra/gen` in `.changeset/gen-openapi-fixes.md` — covers: SC-002, AC-004 — route: steward-changesets — deps: T012
- [ ] T017 Run `pnpm verify` on ci-box and fix what it reports, starting in `packages/developer/gen` — covers: SC-002, SC-003, AC-006 — route: verify-fix — deps: T014, T015, T016

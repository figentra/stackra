---
description: "Tasks for STA-2059: entitlement gates in gen"
---

# Tasks: gen gates calls by the entitlement option, quota meters, hosted entitlements and limits

**Input**: Design documents from `.agents/specs/sta-2059-entitlement-gates/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup

- [ ] T001 Type the `entitlement` option on actions and queries in `packages/application/actions/src/core/types/action-options.type.ts` and `packages/application/actions/src/core/types/query-options.type.ts` — covers: FR-001, P-001, AC-001 — route: spec-task

## Phase 2: User Story 1 - The `entitlement` option is typed and gates the call (Priority: P1)

**Goal**: an author can write `entitlement: X`, and gen gates the call by X.

**Independent Test**: the type cases compile; the manifest lists the call in X's gates.

- [ ] T002 [P] [US1] Type cases for `entitlement` (accepted and refused) in `packages/application/actions/src/core/bases/__tests__/action.base.test.ts` and `packages/application/actions/src/core/bases/__tests__/query.base.test.ts` — covers: FR-001, P-001, AC-001 — route: tests — deps: T001
- [ ] T003 [P] [US1] Local entitlement gate cases (action and query, `entitlements` on the entry) in `packages/developer/gen/src/core/functions/__tests__/build-manifest.function.test.ts` — covers: FR-002, P-002, AC-002 — route: tests — deps: T001
- [ ] T004 [US1] Record named entitlements on the action entry and compute gates after the merge in `packages/developer/gen/src/core/functions/build-manifest.function.ts` — covers: FR-002, P-002, P-006, AC-002 — route: spec-task — deps: T003

## Phase 3: User Story 2 - A quota gates the actions that feed its meter (Priority: P1)

**Goal**: a quota's gates are the actions that feed its meter.

**Independent Test**: a quota on `ai.tokens` gates the metered action only.

- [ ] T005 [US2] Quota meter gate case in `packages/developer/gen/src/core/functions/__tests__/build-manifest.function.test.ts` — covers: FR-003, P-003, AC-003 — route: tests — deps: T004
- [ ] T006 [US2] Record `meter` on action entries and `meter`/`per` on quota entries, gate by meter in `packages/developer/gen/src/core/functions/build-manifest.function.ts` — covers: FR-003, P-003, AC-003 — route: spec-task — deps: T005

## Phase 4: User Story 3 - A host's call or limit reaches a hosted package's entitlement or model (Priority: P1)

**Goal**: hosted entitlements and models resolve; unknown classes are refused.

**Independent Test**: a service IR with a dependency manifest; the merged entry gates the host action, the host limit
counts the hosted model, and two unknown names are refused.

- [ ] T007 [US3] Hosted entitlement, hosted counted model and the two refusal cases in `packages/developer/gen/src/core/functions/__tests__/build-manifest.function.test.ts` — covers: FR-004, FR-005, FR-006, FR-007, P-004, P-005, AC-004, AC-005, AC-006 — route: tests — deps: T006
- [ ] T008 [US3] Resolve entitlements and counted models through the dependency manifests and refuse `entitlement_unknown` and `entitlement_counts_unknown` in `packages/developer/gen/src/core/functions/build-manifest.function.ts` — covers: FR-004, FR-005, FR-006, FR-007, P-004, P-005, AC-004, AC-005, AC-006 — route: spec-task — deps: T007
- [ ] T009 [P] [US3] Key derivation cases in `packages/developer/gen/src/core/functions/__tests__/entitlement-key.function.test.ts` — covers: FR-002, AC-002 — route: tests — deps: T001

## Phase 5: Polish

- [ ] T010 [P] Docs for the option, meters, hosted resolution and the two codes in `packages/developer/gen/README.md` and `packages/application/actions/README.md` — covers: SC-001, AC-006 — route: steward-docs — deps: T008
- [ ] T011 [P] Changeset (minor: `@stackra/actions`, `@stackra/gen`) in `.changeset/sta-2059-entitlement-gates.md` — covers: SC-003, AC-001 — route: steward-changesets — deps: T008
- [ ] T012 Box run: gen, typecheck, test and `stackra gen --check` for the touched members in `packages/developer/gen` — covers: SC-002, SC-003, AC-002 — route: verify-fix — deps: T010, T011

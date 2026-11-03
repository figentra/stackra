---
description: "Tasks for STA-340 endpoint refusals in gen (wp-18)"
---

# Tasks: Endpoint refusals in gen

**Input**: Design documents from `.agents/specs/sta-340-endpoint-checks/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup

- [ ] T001 Merge origin/main in and install on ci-box, confirming the gen goldens pass before any change, in `packages/developer/gen/src/node/__tests__/golden.test.ts` — covers: FR-011, AC-010 — route: gen

## Phase 2: User Story 2 - Every route sits under its area (Priority: P1)

**Goal**: every derived route carries `/<area>` and every manifest entry records its area.

**Independent Test**: `derive-endpoint.function.test.ts` and the golden suite.

- [ ] T002 [US2] Test each area prefix and the `app` default first in `packages/developer/gen/src/core/functions/__tests__/derive-endpoint.function.test.ts` — covers: FR-001, P-001, AC-004 — route: tests — deps: T001
- [ ] T003 [US2] Prefix every area in `packages/developer/gen/src/core/functions/derive-endpoint.function.ts` — covers: FR-001, P-001, AC-004 — route: gen — deps: T002
- [ ] T004 [US2] Record `area` (written or `app`) on every action entry in `packages/developer/gen/src/core/functions/build-manifest.function.ts` — covers: FR-002, P-002, AC-005 — route: gen — deps: T003

## Phase 3: User Story 1 and User Story 3 - The endpoint check (Priority: P1)

**Goal**: one pure check refuses the seven codes in gen's full pass.

**Independent Test**: `check-endpoints.function.test.ts`, one fixture per code beside a conforming one.

- [ ] T005 [US1] Write the fixtures for `endpoint_collision`, `endpoint_versioned` and `endpoint_area_mismatch` first in `packages/developer/gen/src/core/functions/__tests__/check-endpoints.function.test.ts` — covers: FR-003, FR-004, FR-005, P-003, P-004, P-005, EC-01, EC-02, EC-03, EC-04, AC-001, AC-002, AC-003 — route: tests — deps: T004
- [ ] T006 [US3] Add the fixtures for `endpoint_method_mismatch`, `job_without_system_actor`, `cron_input_invalid` and `intent_phrases_missing` in `packages/developer/gen/src/core/functions/__tests__/check-endpoints.function.test.ts` — covers: FR-006, FR-007, FR-008, FR-009, P-006, P-007, P-008, P-009, EC-05, EC-06, AC-006, AC-007, AC-008, AC-009 — route: tests — deps: T005
- [ ] T007 [US1] Implement `checkEndpoints(ir, manifest)` in `packages/developer/gen/src/core/functions/check-endpoints.function.ts` and export it from `packages/developer/gen/src/core/index.ts` — covers: FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, P-010, AC-001, AC-006 — route: gen — deps: T006
- [ ] T008 [US1] Call it in the full pass in `packages/developer/gen/src/core/functions/generate-member.function.ts`, and add the `refusal-endpoint-collision` golden scenario under `packages/developer/gen/__golden__/` — covers: FR-010, P-010, AC-001 — route: gen — deps: T007

## Phase 4: Move the routes outside their area and regenerate

**Goal**: every committed contract and route constant agrees with the prefixed routes.

**Independent Test**: `stackra gen --check` over every member and each package's tests on ci-box.

- [ ] T009 [P] Move loyalty-kit's six overrides under the app prefix in `packages/commerce/loyalty-kit/src/node/actions/` and `packages/commerce/loyalty-kit/src/node/queries/get-balance.query.ts`, with their tests — covers: FR-005, FR-011, AC-010 — route: package — deps: T008
- [ ] T010 [P] Move the award verification route under the public prefix in `packages/application/achievements/src/node/queries/verify-award.query.ts`, with its test — covers: FR-005, FR-011, AC-010 — route: package — deps: T008
- [ ] T011 [P] Move the consent snapshot route and `CONSENT_SNAPSHOT_PATH` under the public prefix in `packages/security/consent/src/node/actions/issue-consent-snapshot.action.ts` and `packages/security/consent/src/contracts/constants/consent-snapshot-path.constant.ts`, with their tests — covers: FR-005, FR-011, AC-010 — route: package — deps: T008
- [ ] T012 [P] Move `ANALYTICS_INGEST_PATH` under the public prefix in `packages/cross-cutting/analytics/src/contracts/constants/analytics-ingest-path.constant.ts`, with the relay driver tests — covers: FR-005, FR-011, AC-010 — route: package — deps: T008
- [ ] T013 [P] Move `DEVICE_ORDER.acknowledgedPath` under the app prefix in `packages/application/clients/src/contracts/constants/device-order.constant.ts`, with its tests — covers: FR-001, FR-011, AC-010 — route: package — deps: T008
- [ ] T014 Regenerate every committed `stackra.manifest.json` and `openapi.json`, the gen golden expectations and `packages/foundation/contracts/src/core/types/__tests__/fixtures/loyalty-kit.stackra.manifest.json` on ci-box, and run `stackra gen --check`, the gen tests and the moved packages' tests — covers: FR-002, FR-011, P-011, SC-002, AC-005, AC-010 — route: codegen-drift — deps: T009, T010, T011, T012, T013

## Phase 5: Polish

- [ ] T015 [P] Update the route table and Enforcement in `.agents/rules/http-conventions.md` and re-project the AGENTS.md block with `tools/scripts/agents-sync.mjs` — covers: SC-001, AC-010 — route: steward-docs — deps: T014
- [ ] T016 [P] List the new codes in `packages/developer/gen/README.md` and `packages/developer/gen/AGENTS.md`, and update the Enforcement lines of `apps/docs/src/docs/adr/0237-generated-api-gateway-in-four-layers.mdx` and `apps/docs/src/docs/adr/0082-public-ids-and-api-areas.mdx` — covers: SC-001, AC-010 — route: steward-docs — deps: T014
- [ ] T017 [P] Add the changeset for `@stackra/gen` and the moved packages in `.changeset/sta-340-endpoint-checks.md` — covers: SC-002, AC-010 — route: steward-changesets — deps: T014

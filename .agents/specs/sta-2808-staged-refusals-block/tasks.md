---
description: "Tasks for STA-2808: gen's staged refusals block everywhere"
---

# Tasks: gen's staged refusals block everywhere

**Input**: Design documents from `.agents/specs/sta-2808-staged-refusals-block/`

**Prerequisites**: plan.md, spec.md

One pull request: T001 to T010.

## Phase 1: User Story 1 - A staged check blocks with no switch (Priority: P1)

**Goal**: the five codes refuse in every run.

**Independent Test**: `generateMember` over `COMMERCE_IR` with each fault.

- [x] T001 [US1] Test first: a parametrised case over the five codes, each in `errors`, not in `warnings`, with no files written, in `packages/developer/gen/src/core/functions/__tests__/generate-member.function.test.ts` — covers: FR-001, P-001, AC-001, AC-002 — route: tests
- [x] T002 [US1] Remove the downgrade and the `strict` option from `generateMember`, and delete the constant, in `packages/developer/gen/src/core/functions/generate-member.function.ts` and `packages/developer/gen/src/core/constants/staged-refusal-codes.constant.ts` — covers: FR-001, P-001, AC-001, AC-002 — route: gen — deps: T001
- [x] T003 [US1] Remove `strict` and the `STACKRA_GEN_STRICT` read from `generate`, and update the file contract of the model-scope check, in `packages/developer/gen/src/node/functions/generate.function.ts` and `packages/developer/gen/src/core/functions/check-model-scope.function.ts` — covers: FR-001, FR-002, P-002, AC-002 — route: gen — deps: T002
- [x] T004 [US1] Update the refusal snapshots in `packages/developer/gen/__golden__/refusal-endpoint-collision/refusals.json.golden` and `packages/developer/gen/__golden__/refusal-reader/refusals.json.golden` — covers: FR-003, P-003, AC-006 — route: gen — deps: T002

## Phase 2: The emitted isolation test

- [x] T005 Test first, then drop the warnings loop from the emitted test, in `packages/developer/gen/src/core/functions/__tests__/emit-isolation-test.function.test.ts` and `packages/developer/gen/src/core/functions/emit-isolation-test.function.ts` — covers: FR-004, P-004, AC-004 — route: gen

## Phase 3: User Story 2 - Nothing reads the variable any more (Priority: P2)

- [x] T006 [US2] Delete `checkGenStrictEnv`, its test, its export and its finding in `packages/developer/repo-checks/src/node/functions/check-gen-strict-env.function.ts`, `packages/developer/repo-checks/src/node/functions/config-findings.function.ts` and `packages/developer/repo-checks/src/node/index.ts` — covers: FR-002, P-002, AC-005 — route: package
- [x] T007 [US2] Drop the variable from the gen task `env` lists and the gate step in `turbo.jsonc` and `packages/developer/flow-preset/preset/preset.yml` — covers: FR-002, P-002, AC-003 — route: package — deps: T006

## Phase 4: Polish

- [x] T008 [P] The staged note in `packages/developer/gen/README.md` and the strict-env example in `apps/docs/src/docs/runbooks/test-infrastructure.mdx` — covers: FR-002, AC-003 — route: steward-docs — deps: T003
- [x] T009 [P] The breaking changeset with the upgrade check in `.changeset/gen-staged-refusals-block.md` — covers: FR-005, AC-005 — route: steward-changesets — deps: T007
- [ ] T010 On ci-box: `stackra gen --check` across the workspace, then typecheck and test of gen (golden included), repo-checks, flow-preset and cli, using `packages/developer/gen/src/node/__tests__/golden.test.ts`; record the log lines on the issue — covers: SC-001, SC-002, SC-003, AC-003, AC-006 — route: verify-fix — deps: T004, T005, T008, T009

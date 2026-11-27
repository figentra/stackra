---
description: "Tasks for STA-2887: property tests for money, ledger, ids and validation, and a mutation-testing trial on iam"
---

# Tasks: property tests for money, ledger, ids and validation, and a mutation-testing trial on iam

**Input**: Design documents from `.agents/specs/sta-2887-property-tests/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The tools

- [x] T001 Add `fast-check` and the Stryker pair to `catalog:quality` in `pnpm-workspace.yaml` (lock in `pnpm-lock.yaml`) and the members' dev dependencies in `packages/commerce/money/package.json`, `packages/commerce/ledger/package.json`, `packages/foundation/contracts/package.json`, `packages/data/model/package.json`, `packages/foundation/validation/package.json` and `packages/security/iam/package.json` (with its `test:mutation` script) — covers: FR-001, FR-004, FR-005, AC-001, AC-004, AC-005 — route: package

## Phase 2: User Story 1 - Money rounding and allocation (Priority: P1)

- [x] T002 [US1] Property tests of `divide`, `times`, `allocate`, cash rounding and the decimal round trip in `packages/commerce/money/src/core/values/__tests__/money-properties.value.test.ts` — covers: FR-001, P-001, P-002, AC-001 — route: tests — deps: T001

## Phase 3: User Story 2 - The ledger never writes an unbalanced posting (Priority: P1)

- [x] T003 [US2] Test first: property tests of postings, balances, floors and reversals, and the two counterexamples, in `packages/commerce/ledger/src/node/services/__tests__/journal-properties.service.test.ts`, over the memory journal moved to `packages/commerce/ledger/src/node/services/__tests__/journal-over.fixture.ts` and `packages/commerce/ledger/src/node/services/__tests__/memory-entries.fixture.ts` — covers: FR-003, FR-006, P-003, P-004, AC-002, AC-003 — route: tests — deps: T001
- [x] T004 [US2] Sum a posting's lines in BigInt in `packages/commerce/ledger/src/node/services/journal.service.ts`, with the changeset `.changeset/ledger-exact-posting-sum.md` — covers: FR-002, P-003, AC-002, AC-003 — route: package — deps: T003

## Phase 4: User Story 3 - Ids and identifier checks (Priority: P2)

- [x] T005 [US3] Property tests in `packages/foundation/contracts/src/core/functions/__tests__/mint-public-id-properties.function.test.ts`, `packages/data/model/src/core/functions/__tests__/public-id-properties.function.test.ts` and `packages/foundation/validation/src/core/functions/__tests__/identifier-properties.function.test.ts` — covers: FR-004, P-005, P-006, AC-004 — route: tests — deps: T001

- [x] T010 [US2] Test first: exact floors in `packages/commerce/ledger/src/node/services/__tests__/journal-properties.service.test.ts` (the floor properties, the overdraft and reversal counterexamples, the beyond-the-range refusal), with the exact sum in `packages/commerce/ledger/src/node/services/__tests__/memory-entries.fixture.ts`; then BigInt nets, balances and reversal cuts and the `RangeError` guard in `packages/commerce/ledger/src/node/services/journal.service.ts`, with the changeset `.changeset/ledger-exact-floors.md` — covers: FR-006, FR-007, FR-008, P-007, P-008, AC-006, AC-007 — route: package — deps: T004

## Phase 5: User Story 4 - The mutation-testing trial (Priority: P2)

- [x] T006 [US4] Stryker over the iam decision functions with `pnpm test:mutation` in `packages/security/iam/stryker.config.mjs` and `packages/security/iam/vitest.stryker.config.ts`, its sandbox and reports ignored in `.gitignore` — covers: FR-005, AC-005 — route: package — deps: T001
- [x] T007 [US4] Tests that kill the first run's security-relevant survivors in `packages/security/iam/src/core/functions/__tests__/` (field access, key coverage, selector anchors, break-glass approval), and the score before and after in `packages/security/iam/AGENTS.md` — covers: FR-005, AC-005 — route: tests — deps: T006

## Phase 6: Polish

- [x] T008 Rewrite the enforcement line of `apps/docs/src/docs/adr/0220-stackra-money-and-the-ledger-package.mdx` and note the property tests in `packages/commerce/money/AGENTS.md` and `packages/commerce/ledger/AGENTS.md` — covers: FR-001, FR-003, AC-001, AC-002 — route: steward-docs — deps: T004, T005
- [x] T009 Run the touched packages' tests, typecheck, oxlint and oxfmt in `packages/commerce/ledger/package.json` and the other five members — covers: SC-001, SC-002, SC-003, SC-005, AC-001, AC-002, AC-003, AC-004 — route: verify-fix — deps: T008

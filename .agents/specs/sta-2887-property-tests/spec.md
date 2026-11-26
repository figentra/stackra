# Feature Specification: property tests for money, ledger, ids and validation, and a mutation-testing trial on iam

**Feature Branch**: `figentra/sta-2887-property-tests`

**Created**: 2026-11-26

**Status**: Tasked <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2887

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: ADR 0220's enforcement line read "planned — property tests on the allocation and the rounding modes", the
ledger had six test files, and no Stackra package used a property-based or mutation-testing tool (`git grep` for
fast-check and Stryker hit two spec files only). Batch 14 of the production-readiness drive (ADR 0182 test tiers) asks
for property tests on money, the ledger, rounding, ids and validation, and a mutation-testing trial on a security
package. This spec is written from what the branch built.

### Sources

- `packages/commerce/money/src/core/values/money.value.ts`, `cash-rounding.value.ts` (rounding, allocation)
- `packages/commerce/ledger/src/node/services/journal.service.ts` (`post`, `append`, `balance`, `reverseWhere`)
- `packages/foundation/contracts/src/core/functions/mint-public-id.function.ts`, `is-public-id.function.ts`
- `packages/data/model/src/core/functions/public-id-to-uuid.function.ts`, `uuid-to-public-id.function.ts`
- `packages/foundation/validation/src/core/functions/` (`luhnValid`, `gtinCheckDigit`, `isGtin`, `mod97Valid`,
  `constantTimeEqual`, `normalizeIdentifier`, `e164`, `publicId`)
- `packages/security/iam/src/core/functions/` (the decision functions the trial mutates)
- ADR 0220 (decisions 1 to 4 and its enforcement line), ADR 0182 (test tiers, the security coverage floor), ADR 0135
  (public id format), ADR 0022 and ADR 0269 (test placement and imports)
- FR-001 to FR-006: the branch's diff against `main`, its test runs and the two Stryker runs (listed under Success
  Criteria)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/commerce/ledger (`Journal.post` sums exactly; test fixtures), packages/commerce/money,
  packages/foundation/contracts, packages/data/model, packages/foundation/validation (property tests and the
  fast-check dev dependency), packages/security/iam (Stryker config, `test:mutation` script, tests that kill
  security-relevant survivors)
- **Public contract change**: none. No export, type or manifest changes. `Journal.post` now refuses every posting whose
  lines do not sum to exactly zero and accepts every one that does, which is its documented contract; before, a
  floating-point sum broke it beside amounts near `Number.MAX_SAFE_INTEGER`. `UnbalancedPostingError.total` stays a
  number.
- **Cross-service events**: none
- **Tenancy and data**: no schema or row change. The ledger fix stops an unbalanced posting from being written, which
  protects every tenant's balances; nothing reads tenant rows differently.
- **Security and privacy**: no runtime change. The iam trial adds tests only: a write mixing a writable and a hidden
  field is refused, a non-public call is never covered by a key, a selector with anything around its shape selects
  nothing, a break-glass grant approved by another person is accepted.
- **Secrets**: none
- **ADR needed**: no new ADR; ADR 0220's enforcement line is rewritten from "planned" to what is enforced
- **New dependencies**: dev only, in the `quality` catalog: `fast-check` 4.10.2 (MIT, one dependency `pure-rand`),
  `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` 10.1.1 (Apache-2.0)
- **Deploy modes**: same in all three (tests and a dev-time tool)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/adr/0220-stackra-money-and-the-ledger-package.mdx` (enforcement),
  `packages/commerce/money/AGENTS.md`, `packages/commerce/ledger/AGENTS.md`, `packages/security/iam/AGENTS.md`
  (the mutation score and how to run it), `.changeset/ledger-exact-posting-sum.md` (patch for `@stackra/ledger`)
- **Lane**: full (money code, a ledger fix and a new catalog entry)
- **Change risk**: R1 (tests and a dev tool; the one runtime change makes `Journal.post` meet its documented contract)

## Glossary _(full lane)_

- **Property test**: a test that states a rule for every input and lets fast-check generate inputs (100 runs by
  default) and shrink a failure to a small counterexample.
- **Floor-and-ceiling model**: the reference rounding in the money property tests, built from the exact quotient's
  floor and ceiling rather than from truncation as `Money` is, so the two implementations check each other.
- **Mutant**: a copy of the source with one small change Stryker injected (an operator, a condition, a literal).
  **Killed** when a test fails on it, **survived** when every test still passes.
- **Mutation score**: killed mutants as a share of all mutants (timeouts count as killed).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Two rounding paths can never disagree on a minor unit (Priority: P1)

A maintainer changes `Money`'s rounding or allocation. A property test compares every rounding mode of `divide` and
`times` with an independent model on generated amounts, divisors and decimal factors, and checks that allocation sums
exactly, so a lost or doubled minor unit fails the build with a counterexample.

**Independent Test**: break the half-even branch or the allocation remainder in `money.value.ts` and run
`money-properties.value.test.ts`.

**Acceptance Scenarios**:

1. **Given** any safe amount, non-zero integer or decimal divisor and rounding mode, **When** `divide` or `times`
   runs, **Then** the result equals the floor-and-ceiling model, or a `RangeError` exactly when the model is beyond
   the safe-integer limit.
2. **Given** any amount and ratios, **When** `allocate` runs, **Then** the parts sum to the amount, each is within one
   minor unit of its share, a zero ratio gets nothing, a refund mirrors the charge and the split does not depend on
   the ratios' scale.

---

### User Story 2 - The ledger never writes an unbalanced posting (Priority: P1)

A service posts a transfer whose amounts are near `Number.MAX_SAFE_INTEGER`. `Journal.post` sums the lines exactly, so
it writes the posting only when the lines sum to zero.

**Independent Test**: `journal-properties.service.test.ts`; the two counterexamples fast-check found are example tests.

**Acceptance Scenarios**:

1. **Given** the lines `[MAX, 2, -MAX, -1]` (off by one), **When** they are posted, **Then** `UnbalancedPostingError`
   with `total: 1` and nothing written.
2. **Given** the lines `[-1, -MAX, -312951, MAX, 312952]` (balanced), **When** they are posted, **Then** they are
   written.
3. **Given** any sequence of appends, **When** the balance is read, **Then** it is the sum of the account's entries,
   a retried reference counting once; with a floor of zero no sequence takes it below zero.

---

### User Story 3 - Ids and identifier checks hold for any input (Priority: P2)

**Acceptance Scenarios**:

1. **Given** any prefix and clock readings in any order, **When** `mintPublicId` runs, **Then** every id is a
   well-formed UUIDv7 public id that sorts after the ones before it.
2. **Given** any UUID, **When** it goes through `uuidToPublicId` and back, **Then** it comes back unchanged and the
   order of ids is the order of UUIDs; any string either decodes or is refused with a `TypeError`.
3. **Given** any body, **When** a Luhn, GTIN or MOD 97-10 check value is appended, **Then** exactly that value is
   accepted and any single-digit change is refused; no check throws on any string.

---

### User Story 4 - The strength of the security tests is measured (Priority: P2)

A maintainer runs `pnpm test:mutation` in `@stackra/iam` and reads the mutation score of the decision functions and
the mutants that survived, file by file.

**Acceptance Scenarios**:

1. **Given** the Stryker config, **When** `pnpm test:mutation` runs, **Then** it mutates `src/core/functions` (not the
   boot-time registrations), runs the unit tier against each mutant and writes `reports/mutation/` (ignored by git).
2. **Given** the first run's survivors, **When** they showed a security gap (a write mixing a writable and a hidden
   field, a non-public call, an unanchored selector, a second-person approval), **Then** a test now kills them.

---

### Edge Cases

- **EC-01**: A number factor printed in exponent form (`1e-7`) is skipped by the number-versus-string property; the
  string form covers decimals with up to eight fraction digits.
- **EC-02**: `-0` is never a `Money` or allocation part (`-x || 0`).
- **EC-03**: The minter's process state carries across property runs, which is the condition its ordering property
  must hold under (the clock stepping back is generated too).
- **EC-04**: The iam declaration-emit test reads the TypeScript preset by a path relative to the package folder, so
  `vitest.stryker.config.ts` leaves it out of the mutation run (it checks emitted types, which no mutant changes).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `@stackra/money` SHALL have property tests for `divide` and `times` in every rounding mode against an
  independent model, for allocation, for cash rounding and for the decimal round trip.
- **FR-002**: `Journal.post` SHALL sum a posting's lines without rounding and refuse it unless the sum is exactly zero.
- **FR-003**: `@stackra/ledger` SHALL have property tests that a balanced posting is written, an unbalanced one is
  refused with nothing written, a balance is the sum of its entries and a floor is never crossed.
- **FR-004**: `@stackra/contracts`, `@stackra/model` and `@stackra/validation` SHALL have property tests for id minting,
  the UUID round trip and order, and the identifier checks (one check value, single-digit changes, never throws).
- **FR-005** (example-only): `@stackra/iam` SHALL run Stryker over its decision functions with `pnpm test:mutation`, and its AGENTS.md
  SHALL record the score.
- **FR-006** (example-only): Every counterexample a property found SHALL stay as an example test.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN `Money`'s half-even branch or allocation remainder is broken THE money property tests SHALL fail with a counterexample.
- **AC-002**: IF a posting's lines do not sum to exactly zero THEN THE `Journal.post` SHALL refuse it with `UnbalancedPostingError` and write nothing, for any safe amounts.
- **AC-003**: WHEN a posting's lines sum to exactly zero THE `Journal.post` SHALL write it, for any safe amounts.
- **AC-004**: WHEN the property tests run THE id and validation helpers SHALL round-trip, keep order and never throw anything but a documented `TypeError` or a `false`.
- **AC-005**: WHEN `pnpm test:mutation` runs in `@stackra/iam` THE Stryker trial SHALL report a mutation score per file.

## Success Criteria _(mandatory)_

- **SC-001**: `money-properties.value.test.ts` (15 properties) proves FR-001 and AC-001 — verified by: unit
- **SC-002**: `journal-properties.service.test.ts` (7 tests, two of them the kept counterexamples) proves FR-002,
  FR-003, FR-006, AC-002 and AC-003; reverting the fix fails three or four of them — verified by: unit
- **SC-003**: `mint-public-id-properties.function.test.ts`, `public-id-properties.function.test.ts` and
  `identifier-properties.function.test.ts` prove FR-004 and AC-004 — verified by: unit
- **SC-004**: `pnpm test:mutation` in `@stackra/iam` reports 79.35% (292 of 368 mutants killed) before the new tests and
  81.25% (299 killed) after, recorded in its AGENTS.md (FR-005, AC-005) — verified by: manual
- **SC-005**: the touched packages' tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- `Journal.post` accepted or refused a posting wrongly only when a partial sum passed 2^53; every posting below that
  behaves as before. No data migration: a posting written wrongly before is corrected by a reversal, as any mistake.
- The new dev dependencies are in the `quality` catalog; nothing ships to consumers.

## Risks

- **R-1**: Property tests are random. Mitigated: fast-check prints the seed and the shrunk counterexample, and every
  counterexample becomes an example test (FR-006).
- **R-2**: The mutation run takes about four minutes and is not in CI. Mitigated: it is a trial; gating on a score is a
  separate decision.

## Out of scope

- Gating CI on a mutation score, or running Stryker on other packages.
- The `balance + amount < floor` comparisons in `append` and `post`, which still add two JavaScript numbers; a balance
  near 2^53 is beyond any ledger the packages serve today.

## Assumptions

- A balance read from the repository is a JavaScript number, as `Repository.sum` returns.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2887, batch 14) · written from the branch's diff and test runs
- 2026-11-26 · Draft → Clarified · Claude (STA-2887, batch 14) · clarifications complete (none open)
- 2026-11-26 · Clarified → Planned · Claude (STA-2887, batch 14) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-2887, batch 14) · tasks.md; the tasks marked done are already on the branch; Implementing waits for the approver's Planned approval (ADR 0502)

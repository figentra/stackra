# Implementation Plan: property tests for money, ledger, ids and validation, and a mutation-testing trial on iam

**Spec**: `.agents/specs/sta-2887-property-tests/spec.md` · **Linear**: STA-2887 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2887-property-tests/spec.md`

## Summary

fast-check joins the `quality` catalog and five packages gain one property test file each, named
`<subject>-properties.<kind>.test.ts` beside the subject's own tests (unit tier, ADR 0182). The money file checks
`divide` and `times` against a floor-and-ceiling model in every mode, allocation, cash rounding and the decimal round
trip. The ledger file found that `Journal.post` summed lines as numbers, which round past 2^53; `post` now sums in
BigInt, and both counterexamples are kept. It then found the same rounding in the floor checks of `append` and `post`
and in `reverseWhere`'s running balance; those are exact too, and a floored write whose floor or balance is not a safe
integer is refused with a `RangeError`. The ledger's memory repository and journal move to two fixtures the tests
share. Stryker joins the same catalog, and `@stackra/iam` runs it over `src/core/functions` with `pnpm test:mutation`;
the first run's security-relevant survivors get tests, and the score before and after goes in its AGENTS.md. ADR 0220's
enforcement line states what is now enforced.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `@stackra/money`, `@stackra/ledger`, `@stackra/contracts`, `@stackra/model`, `@stackra/validation`,
  `@stackra/iam`
- **Testing**: vitest 5 in `src/**/__tests__/` (ADR 0022), fast-check 4.10.2, Stryker 10.1.1 with its vitest runner
- **Storage**: none (the ledger tests use the memory repository fixture)
- **Runtime target**: isomorphic for money, contracts, model and validation; node for the ledger and iam's runner

## Constitution Check

| Law                                   | Result | Note                                                                    |
| ------------------------------------- | ------ | ----------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | tests import their own package and lower tiers only                     |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                              |
| Security                              | PASS   | tests only on iam; the ledger fix refuses more unbalanced postings      |
| HTTP and events                       | N/A    | no route, header or event changes                                       |
| Tenancy                               | PASS   | no tenant data read                                                     |
| Delegation                            | PASS   | one session, one branch                                                 |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                  |
| Test placement (ADR 0022)             | PASS   | every test in `__tests__/` beside its subject                           |
| Versions and catalogs                 | PASS   | three dev dependencies added to `catalog:quality`, members reference it |
| Deploy modes (ADR 0076)               | PASS   | development-time only                                                   |
| Licence tier (ADR 0077)               | PASS   | free; MIT and Apache-2.0 dev tools                                      |
| Docs and ADRs                         | PASS   | ADR 0220 enforcement line, three AGENTS.md files, a ledger changeset    |

## Deploy modes

| Mode       | Behaviour                                                                            |
| ---------- | ------------------------------------------------------------------------------------ |
| SaaS       | `Journal.post` refuses a posting that does not sum to exactly zero; floors are exact |
| On-prem    | same                                                                                 |
| Air-gapped | same                                                                                 |

## Correctness properties

- **P-001**: for every safe amount, non-zero divisor or decimal factor and mode, `Money` rounds as the floor-and-ceiling model, or refuses beyond the safe-integer limit — Validates: FR-001
- **P-002**: for every amount and ratios, the allocated parts sum to the amount and each is within one minor unit of its share — Validates: FR-001
- **P-003**: for every posting of safe amounts, `post` writes it exactly when its lines sum to zero — Validates: FR-002, FR-003
- **P-004**: for every sequence of appends, a balance is the sum of the account's applied entries, and a floor of zero is never crossed — Validates: FR-003
- **P-007**: for every safe balance, floor and debits, `post` refuses exactly when the exact net takes an account below its floor, and `reverseWhere` cuts exactly where the exact running balance meets it — Validates: FR-007
- **P-008**: for every balance beyond the safe-integer range and every floor that is not a safe integer, a floored write throws a `RangeError` and writes nothing — Validates: FR-008
- **P-005**: for every UUID, the public id round-trips and keeps order; for every string, decoding returns a UUID or throws a `TypeError` — Validates: FR-004
- **P-006**: for every body, exactly one Luhn, GTIN or MOD 97-10 check value is accepted, and every single-digit change is refused — Validates: FR-004

## Architecture overview

No production structure changes. `Journal.post` keeps its order of checks; only the sums are exact. Two private
helpers in `journal.service.ts` hold the floor arithmetic: `exactBalance` (a balance read as a BigInt, refused when not
a safe integer) and `endsBelow` (balance plus an exact change against the floor). The property tests
sit beside the example tests and import the subject through the package's `#core`/`#node` aliases. Stryker runs from
the iam package folder with `vitest.stryker.config.ts`, which is the unit config less one declaration-emit test.

## Components and responsibilities

- `Journal.post`, `append`, `reverseWhere` (`ledger/src/node/services/journal.service.ts`): sum lines, nets and
  running balances in BigInt; `floorOf` refuses a floor that is not a safe integer.
- `journal-over.fixture.ts`, `memory-entries.fixture.ts` (`ledger/src/node/services/__tests__/`): the shared memory
  journal, moved from `journal.service.test.ts`.
- `stryker.config.mjs`, `vitest.stryker.config.ts` (`packages/security/iam/`): the trial.

## Files and folders

```text
pnpm-workspace.yaml
pnpm-lock.yaml
.gitignore
.changeset/ledger-exact-posting-sum.md
.changeset/ledger-exact-floors.md
apps/docs/src/docs/adr/0220-stackra-money-and-the-ledger-package.mdx
packages/commerce/money/
├── AGENTS.md
├── package.json
└── src/core/values/__tests__/money-properties.value.test.ts
packages/commerce/ledger/
├── AGENTS.md
├── package.json
└── src/node/services/
    ├── journal.service.ts
    └── __tests__/
        ├── journal.service.test.ts
        ├── journal-properties.service.test.ts
        ├── journal-over.fixture.ts
        └── memory-entries.fixture.ts
packages/foundation/contracts/
├── package.json
└── src/core/functions/__tests__/mint-public-id-properties.function.test.ts
packages/data/model/
├── package.json
└── src/core/functions/__tests__/public-id-properties.function.test.ts
packages/foundation/validation/
├── package.json
└── src/core/functions/__tests__/identifier-properties.function.test.ts
packages/security/iam/
├── AGENTS.md
├── package.json
├── stryker.config.mjs
├── vitest.stryker.config.ts
└── src/core/functions/
    └── __tests__/
        ├── break-glass-grant.function.test.ts
        ├── field-access.function.test.ts
        ├── key-covers.function.test.ts
        └── selects-permission.function.test.ts
```

- `packages/commerce/ledger/src/node/services/journal.service.ts`
- `packages/commerce/money/src/core/values/__tests__/money-properties.value.test.ts`
- `packages/security/iam/stryker.config.mjs`

## Data models and migrations

None.

## Contracts

No contract changes. `Journal.post(lines)` keeps its signature and its documented refusal (`UnbalancedPostingError`
when the lines do not sum to zero); the TSDoc now says the sum is exact. `append`, `post` and `reverseWhere` keep their
signatures; their `@throws RangeError` lines add a floor or a floored balance that is not a safe integer.

## Error handling

An unbalanced posting is refused with `UnbalancedPostingError` (`total` the sum as a number, `lines` the count), as
before. A floored write whose floor or balance is not a safe integer throws a `RangeError` before it writes anything. A failing property prints fast-check's seed and shrunk counterexample.

## Security and tenancy

No runtime security change. The new iam tests pin four behaviours the first mutation run showed unpinned.

## Testing strategy

- AC-001: `money-properties.value.test.ts`; the half-even and allocation-remainder mutations fail it (checked by hand).
- AC-002, AC-003: `journal-properties.service.test.ts` (properties and the two kept counterexamples); reverted fix
  fails them.
- AC-004: `mint-public-id-properties.function.test.ts`, `public-id-properties.function.test.ts`,
  `identifier-properties.function.test.ts`.
- AC-005: `pnpm test:mutation` in `@stackra/iam`, before and after the new tests.
- AC-006, AC-007: the floor properties and the two floor counterexamples in `journal-properties.service.test.ts`;
  the journal before the fix fails four of them, and removing only the balance guard fails the beyond-the-range one.

## Rollout

Two patch changesets for `@stackra/ledger`. Nothing to run on upgrade.

## Delegation and risk plan

One session, one branch. Change risk R1. No follow-up required by this spec.

## ADRs

ADR 0220 (enforcement line rewritten), ADR 0182 (unit tier; the trial measures the security packages it holds to the
higher floor), ADR 0135, ADR 0022, ADR 0269.

## Docs

`apps/docs/src/docs/adr/0220-stackra-money-and-the-ledger-package.mdx`, `packages/commerce/money/AGENTS.md`,
`packages/commerce/ledger/AGENTS.md`, `packages/security/iam/AGENTS.md`, `.changeset/ledger-exact-posting-sum.md`,
`.changeset/ledger-exact-floors.md`.

## Complexity tracking

none

## Follow-up

Gating CI on a mutation score, and Stryker on more security packages, wait for a decision on the score to gate at.

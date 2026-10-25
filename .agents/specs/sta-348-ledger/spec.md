# Feature Specification: `@stackra/ledger` wave 5, double-entry primitives

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/ledger` (commerce, wave 5): the double-entry primitives of ADR 0220 that a ledger composes
over its own append-only entry model. The loyalty kit (wave 6) keeps its points ledger in a `Journal<LedgerEntry>`:
idempotent earns, covered debits, stale-earn expiry, and memory and Postgres drivers behind its own port.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's loyalty kit adopts it once converted, STA-344)
- **Packages touched**: `packages/commerce/ledger` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no table and no migration; the entry table is the consumer's model, isolated by its own trait
  (`BelongsToTenant` in the loyalty kit, `t.scopeId()` for a scope-owned ledger) and row-level security; the journal
  runs in the caller's scope session and adds no filter; no tenant vocabulary (R-59, ADR 0323)
- **Secrets**: none
- **ADR needed**: no (ADR 0220 decides the package; ADR 0149, 0160, 0294 and 0305 bind it); the gaps are listed under
  Open items
- **New dependencies**: none outside the workspace; runtime edges to container, contracts, database, errors, locking and
  model
- **Deploy modes**: same code in all
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/commerce/ledger/README.md`, `packages/commerce/ledger/AGENTS.md`; ADR 0220 is cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public contract that point balances, and later money balances, rely on for correctness)

## Clarifications

### Session 2026-10-25

The package follows ADR 0220, the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and
v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry row: entry `.` exports `Journal`, type-only in the template (`import type { Journal }`, injected as
  `Journal<LedgerEntry>`), so `Journal` is a generic class and not a trait; the trait inventory (ADR 0321) has no
  ledger trait. No `./contracts`, `./node` or `./testing`: the package has no port, no table and no fake a consumer
  needs (the kit ships its own memory driver)
- Template contract: `balance({ account, amount: "points" })`, `append(entry, { floor: 0 })` returning
  `{ written, belowFloor }`, `find({ account, reference })`, and `reverseWhere(where, { kind, referencePrefix, at })`
  returning the reversed entries whose amounts sum to the points removed
- The journal maps its names onto the model's fields through the `@Journaled` class facet (the kit's model names them
  `memberId` and `points`), so gen wires `Journal<M>` as `journalOf(M)` from the type argument alone, as it wires
  `Repository<M>` as `repositoryOf(M)`
- Balances are sums of entries (ADR 0220 decision 4), so there is no running-balance table to keep in step; a covered
  debit holds the account's `Locks` lock (a transaction-level advisory lock on Postgres) while it reads the sum and
  writes, which serialises concurrent debits of one account
- Shared finding (the kit's `expire()` has no floor): the model declares a default floor (`floor: 0`), and a reversal
  that lowers a balance is cut at the floor and still written, so a stale earn whose points were spent can no longer
  take a balance negative, and is never expired twice
- Double entry: `post(lines)` writes balanced lines on several accounts together or not at all
- Owner, 2026-10-24 (R-59, ADR 0323): no tenant vocabulary; ADR 0342: document numbers come from the database
  `Sequence` primitive, so the journal numbers nothing

## User Scenarios & Testing

### User Story 1 - Keep an idempotent balance (Priority: P1)

A driver appends entries through `Journal<M>`; a retried append writes nothing, and the balance is the sum of the
account's entries.

**Independent Test**: `src/core/services/__tests__/journal.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** an entry already appended, **When** it is appended again, **Then** nothing is written and `written` is
   false.
2. **Given** entries on two accounts, **When** one account's balance is read, **Then** it sums only that account's.

### User Story 2 - Never overdraw (Priority: P1)

A covered debit is refused below the floor, and two concurrent debits of one account never overdraw it.

**Independent Test**: `src/core/services/__tests__/journal.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** a balance of 100 and a floor of 0, **When** two debits of 70 run at once, **Then** one is written and the
   other is refused with `belowFloor`.
2. **Given** a debit already applied, **When** it is retried, **Then** it is reported as a duplicate, not below the
   floor.

### User Story 3 - Expire without going negative (Priority: P1)

The expiry job reverses stale earns set-wise; an earn whose points were spent expires only what is left.

**Independent Test**: `src/core/services/__tests__/journal.service.test.ts`.

### User Story 4 - Post a balanced entry (Priority: P2)

A ledger moves an amount between accounts with `post(lines)`; unbalanced lines are refused before anything is written.

**Independent Test**: `src/core/services/__tests__/journal.service.test.ts`,
`src/core/errors/__tests__/unbalanced-posting.error.test.ts`.

### User Story 5 - Map a model and wire the journal (Priority: P2)

A model declares its journal fields with `@Journaled`, and the container builds `journalOf(Model)` from `Locks`.

**Independent Test**: `src/core/decorators/__tests__/journaled.decorator.test.ts`,
`src/core/functions/__tests__/journal-of.function.test.ts`.

### Edge Cases

- A model without `AppendOnly`: a `TypeError` on first use.
- A fractional amount or floor: a `RangeError`.
- A credit with the balance below the floor: written (a credit only raises a balance).
- A reversal cut to nothing: written with amount 0, so the entry counts as handled.
- Two posting lines with one (account, reference) pair: a `TypeError` before anything is written.
- A busy account for the whole lock wait: `lock_unavailable` from `Locks` (503, retryable).

## Requirements

- **FR-001**: The package SHALL be `@stackra/ledger` at `packages/commerce/ledger`, `tier:lib`, entry `.` only.
- **FR-002**: It SHALL export `Journal` with `balance`, `find`, `append` and `reverseWhere` in the shapes the loyalty
  kit's Postgres driver calls, and `post` for balanced entries.
- **FR-003**: `append` SHALL write once per (account, reference) and report a repeat as `written: false`.
- **FR-004**: A write that lowers a balance SHALL hold the account's lock and SHALL be refused, writing nothing, when it
  would leave the balance below its floor (the call's, else the model's default; `null` for none).
- **FR-005**: `reverseWhere` SHALL reverse each matching entry once, oldest first, never reverse a reversal, and cut a
  reversal at the floor while still writing it.
- **FR-006**: `post` SHALL write every line or none, and refuse lines that do not sum to zero or are fewer than two with
  `UnbalancedPostingError`.
- **FR-007**: `@Journaled` SHALL record a model's field map and default floor, and `journalOf(Model)` SHALL give one
  `Journal<Model>` token per model that takes `Locks`.
- **FR-008**: The journal SHALL refuse a model without `AppendOnly` and an amount that is not a safe integer, own no
  table, write no SQL, and carry no tenant vocabulary.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it; the typecheck
  waits for the integrator's install (a new package).

## Open items (for the owner, not blocking)

- The loyalty kit's model gains `@Journaled({ account: "memberId", amount: "points", floor: 0 })` when the template is
  converted (STA-344); the driver's calls stay as they are.
- Gen (STA-339/340): a `Journal<M>` constructor parameter is wired as `journalOf(M)` with the deps `[Locks]`, and gen
  checks the facet's field names against the model.
- No currency dimension yet: a money journal keeps one currency per account, and `post` checks one sum across its
  lines; a currency field joins the facet when a journal mixes currencies. `@stackra/money` is therefore not a
  dependency yet, although the registry row lists it.
- A Postgres integration test (real advisory locks, the unique index, row-level security) runs with the testing
  workflow.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)

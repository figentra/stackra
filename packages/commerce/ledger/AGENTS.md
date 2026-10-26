# AGENTS — @stackra/ledger

Double-entry primitives over an append-only entry model the consumer owns: `Journal<M>`, the `@Journaled` facet,
`journalOf` and `UnbalancedPostingError` (ADR 0220). Member at `packages/commerce/ledger` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305). Entries `.` and `./node`.

## Where code goes

| You are writing…          | It goes in…                                 |
| ------------------------- | ------------------------------------------- |
| The journal and its token | `src/node/services/`, `src/node/functions/` |
| The model facet           | `src/core/decorators/`                      |
| A refusal                 | `src/core/errors/`                          |
| A public type             | `src/core/types/`                           |
| An internal constant      | `src/node/constants/`                       |
| A test                    | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts` is the stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to `src/core/__tests__/index.test.ts`.
- `.` (facet, refusal, types) imports no database code; the database-bound `Journal` and `journalOf` are the `./node`
  entry (owner decision 9). A `./contracts` entry appears only when a file needs it (ADR 0127 note).

## This package

- The package owns no table and no migration: the entry table is the consumer's model, with `AppendOnly`, its scope or
  tenant trait and a unique index over (scope column, account, reference). Never add a balance table: a balance is the
  sum of entries (ADR 0220 decision 4).
- No SQL here: reads and writes go through `repositoryOf(model)`, and account locks through `Locks`. A write that
  lowers a balance always holds its account's lock; never add a debit path that skips it.
- Floors: the model's default from `@Journaled`, a call's `floor` over it, `null` for none. A reversal is cut at the
  floor, never skipped, so an entry is handled once.
- `lines(reference)` reads a posting back across accounts (STA-1240). The unique index leads with the scope and account,
  so a consumer that calls it often gives its model an index on (scope column, reference).
- Amounts are safe integers (points or minor units). A money model names a `currency` field in `@Journaled`: postings share one
  currency and balances are per currency (ADR 0220).
- No document numbering: numbers come from the database `Sequence` primitive (ADR 0342) when it ships.
- No tenant word here (final review R-59, ADR 0323): scope isolation is the entry table's row-level security.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data         | Where                        | Handling                                                                      |
| ------------ | ---------------------------- | ----------------------------------------------------------------------------- |
| Account keys | the consumer's entry table   | public ids chosen by the consumer, classified on its model; never logged here |
| Lock keys    | Postgres `pg_locks` (hashed) | model name and account key; internal names, never returned to a caller        |

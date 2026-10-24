# AGENTS — @stackra/ledger

Double-entry primitives over an append-only entry model the consumer owns: `Journal<M>`, the `@Journaled` facet,
`journalOf` and `UnbalancedPostingError` (ADR 0220). Member at `packages/commerce/ledger` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305). Entry `.` only.

## Where code goes

| You are writing…          | It goes in…                                 |
| ------------------------- | ------------------------------------------- |
| The journal               | `src/core/services/`                        |
| The model facet           | `src/core/decorators/`                      |
| A token factory or helper | `src/core/functions/`                       |
| A refusal                 | `src/core/errors/`                          |
| A public type             | `src/core/types/`                           |
| An internal constant      | `src/core/constants/`                       |
| A test                    | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts` is the stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to `src/core/__tests__/index.test.ts`.
- Everything is node runtime (it reaches Postgres through @stackra/database), as database's own `.` entry is. A
  `./contracts` or `./node` entry appears only when a file needs it (ADR 0127 note).

## This package

- The package owns no table and no migration: the entry table is the consumer's model, with `AppendOnly`, its scope or
  tenant trait and a unique index over (scope column, account, reference). Never add a balance table: a balance is the
  sum of entries (ADR 0220 decision 4).
- No SQL here: reads and writes go through `repositoryOf(model)`, and account locks through `Locks`. A write that
  lowers a balance always holds its account's lock; never add a debit path that skips it.
- Floors: the model's default from `@Journaled`, a call's `floor` over it, `null` for none. A reversal is cut at the
  floor, never skipped, so an entry is handled once.
- Amounts are safe integers (points or minor units). No currency dimension yet: a money journal keeps one currency per
  account.
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

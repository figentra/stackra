# AGENTS — @stackra/pricing

Pricing primitives on `@stackra/money`. Member at `packages/commerce/pricing` (`tier:lib`), in the programming model
v3.1 shape (ADR 0294, 0305). Entries `.` and `./contracts` (the `TaxProvider` port).

## Where code goes

| You are writing…             | It goes in…                                 |
| ---------------------------- | ------------------------------------------- |
| A value class (`PricePoint`) | `src/core/values/<name>.value.ts`           |
| A type (`PriceTier`)         | `src/core/types/<name>.type.ts`             |
| An enum (`PriceKind`)        | `src/core/enums/<name>.enum.ts`             |
| A pure evaluation function   | `src/core/functions/<name>.function.ts`     |
| A port or its types          | `src/contracts/{ports,types}/`              |
| A memory driver              | `src/core/drivers/<name>.driver.ts`         |
| A test                       | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts` and `src/contracts/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339);
  add every new public file to its barrel and to that entry's `__tests__/index.test.ts`. `./contracts` imports no
  other entry.

## This package

- No programming-model kind, no decorator, no registry: the old `@PriceModel` is not a v3 kind, and a pricing kind
  needs an ADR first (registry A9). `PriceKind` is a data discriminant of a price entry, not a kind.
- This is the pure evaluation package of ADR 0337 (ADR 0205 STA-474 note): `resolvePrice`, `evaluateFormula` and
  `taxByRates` are pure. Every input is an argument (lists, rates, tables, the instant); no clock, no I/O, no
  service. The OS pricing service owns the records (price lists, Markets, channels) and calls these functions; a till
  calls the same functions on its replica.
- Configuration, not code: no rate, tax class, markup, price point, channel or country appears here. They arrive as
  data (catalogue records, market-pack tax tables and rate-source keys).
- A missing rate, input or tax row is a `RangeError`, never a zero and never a guess.
- Runtime dependencies are `@stackra/money`, `@stackra/contracts` and `@stackra/container` (the memory driver).
  Refusals are `RangeError`s.
- All arithmetic goes through `Money`; never compute on `minor` directly, and never round except by a `Rounding` the
  caller names.
- Value classes are plain data (no `#private` fields, not frozen, private constructor, static builder), like `Money`.
- Only add a symbol a consumer imports today (the template, a package, a service, or the registry row).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` alias.
- No `enum`, no `#private` fields, no parameter properties (`erasableSyntaxOnly`), no `*.stories.*`.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/pricing` — `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.

## PII

| Data | Where | Handling                                                     |
| ---- | ----- | ------------------------------------------------------------ |
| None | —     | Amounts, quantities and currency codes only; no person data. |

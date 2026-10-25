# AGENTS — @stackra/pricing

Pricing primitives on `@stackra/money`. Member at `packages/commerce/pricing` (`tier:lib`), in the programming model
v3.1 shape (ADR 0294, 0305). Entry `.` only.

## Where code goes

| You are writing…             | It goes in…                                 |
| ---------------------------- | ------------------------------------------- |
| A value class (`PricePoint`) | `src/core/values/<name>.value.ts`           |
| A type (`PriceTier`)         | `src/core/types/<name>.type.ts`             |
| A test                       | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to the export list in `src/core/__tests__/index.test.ts`.

## This package

- Primitives only. No kind, no decorator, no registry: the old `@PriceModel` is not a v3 kind, and a pricing kind
  needs an ADR first (registry A9). Price resolution, price lists and markets are the OS pricing service.
- Runtime dependency is `@stackra/money` (plus `@stackra/contracts` for `definePackage`). Refusals are `RangeError`s.
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

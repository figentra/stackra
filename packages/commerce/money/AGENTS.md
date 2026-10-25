# AGENTS — @stackra/money

Money in minor units and its codecs. Member at `packages/commerce/money` (`tier:lib`), in the programming model v3.1
shape (ADR 0294, 0305). Entries `.` and `./contracts` (the `RateSource` port).

## Where code goes

| You are writing…        | It goes in…                                 |
| ----------------------- | ------------------------------------------- |
| The `Money` value class | `src/core/values/money.value.ts`            |
| An enum (`Rounding`)    | `src/core/enums/<name>.enum.ts` (`Enum.of`) |
| A codec (`money()`)     | `src/core/functions/<name>.function.ts`     |
| A table (`CURRENCIES`)  | `src/core/constants/<name>.constant.ts`     |
| A type (`CurrencyCode`) | `src/core/types/<name>.type.ts`             |
| A port or its types     | `src/contracts/{ports,types}/`              |
| A memory driver         | `src/core/drivers/<name>.driver.ts`         |
| A test                  | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts` and `src/contracts/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339);
  add every new public file to its barrel and to that entry's `__tests__/index.test.ts`. `./contracts` imports no
  other entry.

## This package

- Runtime dependencies are `@stackra/contracts`, `@stackra/container` (the memory driver's `Driver` base) and `zod`
  only. No `@stackra/errors` (a later wave): refusals are `RangeError`s.
- Configuration, not code: no currency's cash step, no rate source and no rate lives here. Cash rounding rows, the
  rate-source key and the metal-rate feed are market-pack data; this package holds the arithmetic only.
- A rate is a decimal string end to end (`RateSnapshot.rate`) and every product goes through `decimalProduct` and
  `Money#times(string)`, so no float touches a price.
- `minor` is always a safe integer. Every new operation computes in BigInt and passes the result through the
  safe-integer check; nothing rounds silently, and a rounding mode is chosen once per operation.
- `Money` is an ORM embeddable: no `#private` fields, no frozen instances, no state beyond `minor` and `currency`
  (ADR 0294 decision 27). Operations return new values.
- `Money.of` stays pure: gen evaluates it in defaults (ADR 0294 decision 26).
- `CURRENCIES` is the one source of codes and exponents; `CurrencyCode` and `currencyCode()` derive from it. Removing
  a code is a breaking change.
- Only add a symbol a consumer imports today (the template, a package, or the registry row).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` alias.
- No `enum`, no `#private` fields, no parameter properties (`erasableSyntaxOnly`), no `*.stories.*`.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/money` — `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.

## PII

| Data | Where | Handling                                                       |
| ---- | ----- | -------------------------------------------------------------- |
| None | —     | Amounts and currency codes only; no person is named or stored. |

# Plan: `@stackra/money` wave 1b

**Spec**: `.agents/specs/sta-348-money/spec.md`

## Design

- `src/core/constants/currencies.constant.ts`: `CURRENCIES`, a frozen map of ISO 4217 code to its exponent (minor
  digits). Internal: not exported from the entry.
- `src/core/types/currency-code.type.ts`: `CurrencyCode = keyof typeof CURRENCIES` (a literal union).
- `src/core/enums/rounding.enum.ts`: `Rounding`, `Enum.of` from `@stackra/contracts`.
- `src/core/values/money.value.ts`: the `Money` class. Arithmetic runs on BigInt: a factor or divisor is read as the
  decimal its `String()` prints, as an exact ratio, and the quotient is rounded once by the mode. Every result passes
  the safe-integer check before it becomes a `number`. Allocation is the largest-remainder method on exact integer
  weights, ties to the earlier index.
- `src/core/functions/currency-code.function.ts`: `currencyCode()` is `z.enum` of the codes.
- `src/core/functions/money.function.ts`: `money()` is `z.codec(z.object({ minor: z.int(), currency }), z.custom<Money>)`;
  `z.int()` in zod 4 accepts safe integers only.
- `src/core/index.ts`: the stand-in barrel until gen writes entries (STA-339); tool configs follow the contracts
  member until gen writes them.

## Constitution check

- Boundaries: runtime imports `@stackra/contracts` (`Enum`) and `zod` only; dev-only `@stackra/testing` and presets.
- Versions: catalogs and `workspace:*` only.
- Naming: `money()` and `currencyCode()` are the names generated code imports (template); `CURRENCIES` is a
  module-level constant (SCREAMING_SNAKE).
- No custom error class: wave 1b cannot depend on `@stackra/errors` (wave 1c); refusals are `RangeError`.

## Properties

- **P-001**: For every amount and every valid ratio list, `allocate(r)` parts sum to the amount and differ from the
  exact shares by less than one minor unit.
- **P-002**: For every mode, `divide(d, mode)` and `times(1/d, mode)` agree when `1/d` prints exactly.
- **P-003**: `z.encode(money(), money().parse(w))` equals `w` for every valid wire value `w`.

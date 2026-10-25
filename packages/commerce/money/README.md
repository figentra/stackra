# @stackra/money

Money in whole minor units of one ISO 4217 currency, with exact arithmetic, explicit rounding, allocation that never
loses a minor unit, and the `money()` and `currencyCode()` codecs that generated schemas import.

**Tier:** `tier:lib` (`packages/commerce/money`), entry `.` only. Depends on `@stackra/contracts` and `zod`; isomorphic,
with no clock, locale, environment or network read.

## Entry points

| Import           | Holds                        | Exports                                                      |
| ---------------- | ---------------------------- | ------------------------------------------------------------ |
| `@stackra/money` | `src/core/`: isomorphic code | `Money`, `Rounding`, `money`, `currencyCode`, `CurrencyCode` |

Entry barrels are generated, never authored (ADR 0294 decision 15); until `stackra gen` writes them (STA-339),
`src/core/index.ts` is a stand-in barrel.

## `Money`

```ts
import { Money, Rounding } from "@stackra/money";

const price = Money.ofMinor(9_900, "USD"); // from minor units, the form prices travel in
price.toDecimal(); // "99.00", for JSON-LD offers and decimal APIs
price.divide(12, Rounding.Down).toDecimal(); // "8.25", never a rounded-up per-month price

Money.of("12.50", "USD").minor; // 1250, pure, so gen evaluates it in a field default
Money.of("10.00", "USD")
  .allocate([1, 1, 1])
  .map((m) => m.minor); // [334, 333, 333]
```

| Member                          | Does                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `minor`, `currency`             | the amount in minor units (a safe-integer `number`) and its `CurrencyCode`          |
| `Money.ofMinor(minor, code)`    | builds from minor units; `code` may be a plain string, checked here                 |
| `Money.of(decimal, code)`       | builds from `"12.50"`; more fraction digits than the currency has is refused        |
| `Money.zero(code)`              | nothing in `code`, the start of a sum                                               |
| `Money.max(a, ...rest)`         | the largest amount (`Money.max(total, zero)` clamps at zero); same currency only    |
| `plus`, `minus`                 | same currency only                                                                  |
| `times(f, r?)`, `divide(d, r?)` | one rounding of the exact result; half-even by default                              |
| `allocate(ratios)`              | parts sum to the whole; left-over units go to the largest remainders, earlier first |
| `equals(other)`                 | same amount and currency                                                            |
| `toDecimal()`                   | plain decimal with the currency's exponent (`"12.50"`, `"1000"` JPY, `"1.250"` KWD) |

- The exponent is ISO 4217's (ADR 0220): KWD, BHD, JOD, OMR, IQD, LYD and TND have three digits; JPY, KRW and the
  CFA francs none.
- Minor units are a JavaScript `number`. A value or a result beyond `Number.MAX_SAFE_INTEGER` throws a `RangeError`,
  never rounds (ADR 0294 decision 27). The database column is a `bigint` read as a number.
- A JavaScript factor or divisor is read as the decimal it prints as and the arithmetic is BigInt, so
  `Money.ofMinor(100, "USD").times(0.145, Rounding.HalfUp)` is 15, not 14.
- Mixing currencies throws a `RangeError`. Conversion needs a rate and its source (ADR 0220) and is not here.
- Display goes through the i18n formatting hooks (`useMoney`), not `toDecimal()`.
- `JSON.stringify(money)` is the wire form `{"minor":1250,"currency":"USD"}`.

## `Rounding`

`Down` (toward zero), `Up` (away from zero), `HalfUp` (nearest, half away from zero) and `HalfEven` (nearest, half
to even; the default). A negative amount rounds like its positive mirror.

## Codecs

Generated `#stackra/schemas` and clients write these; authored code does not.

```ts
import { currencyCode, money } from "@stackra/money";

export const OrderLine$ = z.object({ unitPrice: money() }); // { minor, currency } <-> Money
export const CommerceConfig$ = z.object({ defaultCurrency: currencyCode().default("USD") });
```

`z.output` of `money()` is exactly `Money` and of `currencyCode()` exactly `CurrencyCode`, so the generated `X$Check`
holds.

## Tasks

| Task            | Command                                         |
| --------------- | ----------------------------------------------- |
| `build`         | `tsdown`                                        |
| `typecheck`     | `tsc --noEmit`                                  |
| `lint`          | `oxlint .`                                      |
| `test`          | `vitest run`                                    |
| `test:coverage` | `vitest run --coverage` (shared gate: 80/80/70) |
| `format`        | `oxfmt --write .`                               |
| `format:check`  | `oxfmt --check .`                               |
| `clean`         | `rm -rf dist coverage .turbo`                   |

Run one with `pnpm turbo run <task> --filter=@stackra/money`.

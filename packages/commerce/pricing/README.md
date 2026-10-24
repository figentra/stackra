# @stackra/pricing

Pricing primitives on `@stackra/money`: the price points a market rounds its prices to, and graduated per-unit bands
for metered usage over an included amount. The pricing engine (price resolution, price lists, markets) is the OS
pricing service; this package holds only the arithmetic it and other services share.

**Tier:** `tier:lib` (`packages/commerce/pricing`), entry `.` only. Depends on `@stackra/money` (and
`@stackra/contracts` for its member definition); isomorphic, with no clock, locale, environment or network read.

## Entry points

| Import             | Holds                        | Exports                                     |
| ------------------ | ---------------------------- | ------------------------------------------- |
| `@stackra/pricing` | `src/core/`: isomorphic code | `PricePoint`, `GraduatedPrice`, `PriceTier` |

Entry barrels are generated, never authored (ADR 0294 decision 15); until `stackra gen` writes them (STA-339),
`src/core/index.ts` is a stand-in barrel.

## `PricePoint`

Prices round to a price point, per market (ADR 0244 decision 6). A point is every `k × step + ending` in one currency.

```ts
import { Money, Rounding } from "@stackra/money";
import { PricePoint } from "@stackra/pricing";

const charm = PricePoint.ofMinor(100, 99, "USD"); // 0.99, 1.99, 2.99 …
charm.apply(Money.of("12.34", "USD")).toDecimal(); // "12.99", up by default
charm.apply(Money.of("12.34", "USD"), Rounding.Down).toDecimal(); // "11.99"
charm.apply(Money.of("12.34", "USD"), Rounding.HalfEven).toDecimal(); // "11.99", the nearest
```

- `step` and `ending` are whole minor units of the point's currency; `ending` is 0 to `step - 1`.
- `Up` (the default) never undercuts the computed price; `Down` never exceeds it; the half modes take the nearest.
- A price at or below the first point becomes the first point; zero stays zero, so a free item stays free.
- A negative price or one in another currency is a `RangeError`.

## `GraduatedPrice`

Metered usage is priced over the included amount (ADR 0242 decision 2). Each unit costs the price of the band it falls
in.

```ts
import { Money } from "@stackra/money";
import { GraduatedPrice } from "@stackra/pricing";

const messages = GraduatedPrice.of([
  { upTo: 1_000, unitPrice: Money.zero("USD") }, // included
  { upTo: 10_000, unitPrice: Money.ofMinor(2, "USD") },
  { upTo: null, unitPrice: Money.ofMinor(1, "USD") },
]);
messages.total(12_000).toDecimal(); // "200.00"
```

- Bounds ascend, count from the first unit overall, and only the last band is open (`upTo: null`).
- Quantities are whole units and unit prices whole minor units, so a total is exact. Price a unit cheaper than one
  minor unit per block: count thousands of API calls, not calls.
- Mixed currencies, a bad bound or a negative or fractional quantity is a `RangeError`.

## Not here

- Price models as a kind: the old `@PriceModel` decorator is not a v3 kind, and adding a pricing kind needs an ADR.
- Price resolution, price lists and markets: the OS pricing service (ADR 0219 decision 5, ADR 0244).
- Currency conversion: it needs a rate and its source (ADR 0220).

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

Run one with `pnpm turbo run <task> --filter=@stackra/pricing`.

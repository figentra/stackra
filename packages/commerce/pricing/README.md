# @stackra/pricing

Pricing primitives on `@stackra/money`: the price points a market rounds its prices to, and graduated per-unit bands
for metered usage over an included amount. The pricing engine (price resolution, price lists, markets) is the OS
pricing service; this package holds only the arithmetic it and other services share.

**Tier:** `tier:lib` (`packages/commerce/pricing`), entries `.` and `./contracts`. Depends on `@stackra/money`,
`@stackra/contracts` and `@stackra/container`; isomorphic, with no clock, locale, environment or network read.

## Entry points

| Import                       | Holds                        | Exports                                                                                                                                                                                                                                                         |
| ---------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/pricing`           | `src/core/`: isomorphic code | `PricePoint`, `GraduatedPrice`, `PriceTier`, `PriceKind`, `resolvePrice`, `evaluateFormula`, `taxByRates`, `MemoryTaxProviderDriver` and the types `PriceList`, `ItemPrice`, `PriceAdjustment`, `PriceFormula`, `FormulaTerm`, `PriceQuery`, `ResolvedPrice`, … |
| `@stackra/pricing/contracts` | `src/contracts/`: the port   | `TaxProvider`, `TaxRequest`, `TaxLine`, `TaxAddress`, `TaxQuote`, `TaxedLine`                                                                                                                                                                                   |

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

## `resolvePrice`: the pure evaluation

```ts
import { resolvePrice } from "@stackra/pricing";

const line = resolvePrice(replica.priceLists, {
  itemId: "var_ring_18k",
  quantity: 1,
  currency: "SAR",
  market: "mkt_ksa",
  channel: "chn_store", // a delivery app is a channel with its own (derived) list
  at: clock.now(),
  inputs: { weight_grams: 12.5, purity: "0.75" }, // the item's fields a formula reads
  rates: cart.rates, // the rate snapshots kept with the cart
});
line?.total; // Money
line?.sources; // [{ listId, revision }, ...]: stored with the line (ADR 0337 decision 3)
```

- A list applies when its currency matches, its Market and channel are null or equal, and `at` is in
  `[validFrom, validTo)`. The most specific list that prices the item wins (a channel weighs more than a Market); a
  tie goes to the earlier list, so the caller orders by priority. No list gives `null`.
- A derived list (`adjustment`) multiplies its base list's price by `factor` with its `rounding`, then moves a unit
  price onto its `pricePoint`: one list per delivery app with the restaurant's markup is data, not code.
- `PriceKind.Formula` prices from `PriceFormula` terms: a rate term multiplies named inputs and a factor and prices
  them at the matching rate snapshot (`ExchangeRate#priceOf`); an amount term charges a `Money` per unit of its
  inputs. Each term rounds once. A missing input or rate refuses.

## Tax

```ts
import { taxByRates } from "@stackra/pricing";
import { TaxProvider } from "@stackra/pricing/contracts";

taxByRates(request, pack.taxTable); // a market's own table (VAT), pure, usable offline
await tax.quote(request); // the TaxProvider the market pack names (a provider driver for US sales tax)
```

- A table row is `{ jurisdiction, taxClass, rate }`; the subdivision's row (`us-ny`) wins over the country's (`us`).
- Inclusive prices have the tax taken out (`amount - amount / (1 + rate)`), exclusive ones have it added, each line
  rounded once with the table's rounding.
- A class with no row refuses; a zero-rated class has a `"0"` row.

## Not here

- Price models as a kind: the old `@PriceModel` decorator is not a v3 kind, and adding a pricing kind needs an ADR.
- The records (price lists, Markets, channels, tax registrations): the OS pricing service (ADR 0219 decision 5, ADR
  0244).
- Tax provider drivers (US sales tax): OS integrations connectors behind `TaxProvider`.

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

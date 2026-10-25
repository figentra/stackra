---
"@stackra/pricing": minor
---

Add `@stackra/pricing`, pricing primitives on `@stackra/money`. `PricePoint.ofMinor(step, ending, currency)` describes
the price points a market rounds to (`100, 99, "USD"` is 0.99, 1.99, 2.99 …) and `apply(price, rounding)` moves a price
onto one, up by default, with zero kept free. `GraduatedPrice.of(tiers)` prices metered usage in ascending `PriceTier`
bands, the first often an included amount, and `total(quantity)` is the exact charge. Price models as a kind, price
resolution and markets are not part of this package.

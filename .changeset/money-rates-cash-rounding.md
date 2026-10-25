---
"@stackra/money": minor
---

Add exchange and metal rates, cash rounding and 6-decimal unit prices: the `RateSource` port with `RatePair` and
`RateSnapshot` in a new `./contracts` entry, `ExchangeRate` (`convert` across exponents, `priceOf` a commodity quantity),
`MemoryRateSourceDriver`, `CashRounding` over a market pack's cash rounding row (`CashRoundingRule`), `UnitPrice` held in
millionths, and the exact `decimalProduct`. `Money#times` and `Money#divide` also take a decimal string.

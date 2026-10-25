---
"@stackra/pricing": minor
---

Add the pure price evaluation (ADR 0337): `resolvePrice` over price lists by currency, Market, sales channel and date,
with fixed, graduated and formula prices (`PriceKind`, `evaluateFormula` over rate snapshots and item fields) and
derived lists with a markup and a price point; tax from a market's own rate table (`taxByRates`) and the `TaxProvider`
port in a new `./contracts` entry with `MemoryTaxProviderDriver`.

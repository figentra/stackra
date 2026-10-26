---
"@stackra/fiscal": minor
---

Add `MarketPackFiscalPackSourceDriver`, the production `FiscalPackSource` over `@stackra/market-packs`: it reads
`fiscal.invoice` and `fiscal.till` from the resolved market on the date asked, answers `null` for an unknown market and
refuses a malformed value with `FiscalOptionsInvalidError`.

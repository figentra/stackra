---
"@stackra/money": minor
---

Add `@stackra/money`: `Money` holds an amount in whole minor units of one ISO 4217 currency (`Money.ofMinor`,
`Money.of("12.50", "USD")`), `Money.zero` and `Money.max`, with exact `plus`, `minus`, `times` and `divide`, one explicit `Rounding` per
operation (`Down`, `Up`, `HalfUp`, `HalfEven`, half-even by default), `allocate` that never loses a minor unit, and
`toDecimal()` with the currency's own exponent. Amounts beyond `Number.MAX_SAFE_INTEGER` and mixed currencies are
refused. The `money()` and `currencyCode()` codecs that generated schemas use now ship from this package, with
`CurrencyCode` as the union of ISO 4217 codes.

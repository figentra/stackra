---
"@stackra/payments": minor
---

Add the restricted-tender kind (ADR 0445): `TenderKind`, `RestrictedTenderProgram`, `TenderLine`, `TenderSplit`, the
`RestrictedTenderPrograms` and `TenderEligibility` ports with memory drivers and the market-pack programs driver,
`splitTender`, `RestrictedTenderService` (split, terminal, hosted checkout, capture at fulfilment), the
`restricted_tender` and `terminal_pin` capabilities, and `tender`, `program` and `pinEntry` on `TerminalRequest`
(`tender` and `program` on `CheckoutRequest`).

---
"@stackra/pricing": minor
---

<!--
Stackra file contract:
Purpose: the changeset of stackra-62 (STA-931) for @stackra/pricing: the production tax driver and its gateway type.
Boundary: release notes only.
Runtime: none (Markdown)
Governing contract: ADR 0379; ADR 0443.
-->

Add `ConnectionTaxProviderDriver`, the production `TaxProvider` (ADR 0379): the Market's pack engine, read through the
new host type `TaxTables`, picks `taxByRates` over its own table or the `tax` Connection `ProviderResolver` resolves
(Stripe Tax as the managed default for `us`, Avalara and TaxJar own-account, all pack data). It also records and voids
a finalised sale at the same Connection; provider quote sources and transaction ids are
`<provider>:<connectionId>:<id>`. New contract type `TaxGateway` (`./contracts`), which the vendor Connections in OS
integrations implement. New dependency: `@stackra/integrations` (types only; no cycle).

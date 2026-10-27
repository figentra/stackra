---
"@stackra/integrations": minor
---

Accounting journals (STA-794, stackra-44): account mapping per Connection (`AccountMap` and `AccountMapped` in
`./contracts`, `mapJournal`, `postMappedJournal`, `UnmappedAccountError`), so a journal in our account and tax keys is
posted once in the tenant's provider codes and an unmapped key posts nothing. `./testing` adds
`MemoryAccountingConnector` and the recorded-case runner every accounting driver passes (`replayIntegrationApi`,
`runAccountingCase`, `AccountingCase`, `RecordedExchange`), with recordings marked certification pending until a sandbox
capture. The Xero, QuickBooks Online, Zoho Books, Qoyod and Daftra drivers are OS integrations connectors (ADR 0443
decision 7).

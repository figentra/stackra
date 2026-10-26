---
"@stackra/integrations": minor
---

Add `ProviderResolver#candidates`, the ordered failover list with `ProviderMode` (own or managed) per entry, and a
Market argument on `resolve`; `ProviderChoice.connectionId` is optional. Add `MarketPackProviderDefaultsDriver` over
`ProviderPackSource`, the `payroll` category with the `PayrollConnector` contract, `assertPayInputs` and
`MemoryPayrollConnector` (ADR 0422).

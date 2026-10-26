---
"@stackra/ai": minor
---

Add the three integration events of ADR 0100 decision 11, `ApprovalRequested`, `ApprovalResolved` and `RunCompleted`,
recorded by `PostgresRunStoreDriver` on the row that changes so the outbox writes them with it (STA-781).

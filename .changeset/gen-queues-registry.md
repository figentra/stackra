---
"@stackra/gen": patch
---

<!-- Purpose: release note for the typed queue registry. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0148; STA-1723. -->

Gen writes `#stackra/queues` for a service with a job action: `Queues`, built with `queues()` of `@stackra/queue` over
the queues its job actions name and `default`, so a job writes `queue: Queues.Billing` and a queue no job names any
more is a type error. The reader reads `Queues.<Name>` before the file exists.

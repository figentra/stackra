---
"@stackra/gen": patch
---

A service that runs `@stackra/queue` now connects `QueueWorkerService` in its generated `boot`, so a job that a
generated Encore subscription delivers, or that `queue:work` reserves, runs through the pipeline instead of throwing
"QueueWorkerService is not connected" (STA-2046).

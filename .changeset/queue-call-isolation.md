---
"@stackra/queue": patch
---

The worker runs a job and its `onDeadLetter` hook through the bound `CallIsolation` as the job's stored actor in its
scope (STA-1699, ADR 0495), and no longer wraps an attempt in a scope session of its own when one is bound; with none
bound it runs in `Database.withScope` as before.

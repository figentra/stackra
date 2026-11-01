---
"@stackra/queue": patch
---

`QueueService.push`, `chain` and `batch` refuse a `scope` that is not shaped like a platform `ScopeRef` with the new
`ScopeNotPlatformWrittenError` (`scope_not_platform_written`), and `QueueWorkerService` dead-letters a scoped job at once
with the new `JobIsolationMissingError` (`job_isolation_missing`) when no `CallIsolation` is bound, instead of running it
in a scope session that set no tenant (STA-1823, ADR 0495 note of 2026-11-01).

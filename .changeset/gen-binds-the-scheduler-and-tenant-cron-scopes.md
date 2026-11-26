---
"@stackra/gen": patch
---

A service that declares `@stackra/scheduler` now gets `SchedulerService` bound in its generated wiring: the generated
Encore CronJobs (`stackra-encore/<member>/cron.ts`) resolve it to fire each cron and tick the stored schedules, and
nothing else bound it, so every cron of such a service failed with "Nothing binds SchedulerService". A service that
also declares `@stackra/tenancy` binds the scheduler's `CronScopes` port to tenancy's `tenancy` driver by default, so a
`perScope` cron runs once per tenant node instead of nowhere (the scheduler's memory driver lists no scope) and the boot
no longer has two candidates and nothing to choose between them (STA-2856).

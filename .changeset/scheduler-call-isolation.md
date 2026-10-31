---
"@stackra/scheduler": patch
---

A job the scheduler pushes in a scope now carries the scheduler's actor (`sys_scheduler`, a system actor) acting in that
scope as its `origin` (STA-1699, ADR 0495), so the queue worker runs it through `CallIsolation` bound to the scope; a
platform run carries none, and a platform cron over tenants stays one job per scope.

---
"@stackra/outbox": minor
---

The change log maintenance and outbox prune jobs move to the add-on `@stackra/data-maintenance` (ADR 0462 decision 1),
which holds their system-held permissions. `./node` no longer exports `MaintainChangeLogAction`, `PruneOutboxAction` or
their input and output schemas; `.` adds `pruneOutbox(outbox, inbox, days, now)`, the work the prune job calls.

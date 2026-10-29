---
"@stackra/database": minor
---

The partition and retention jobs move to the add-on `@stackra/data-maintenance` (ADR 0462 decision 1), which holds their
system-held permissions. `./node` no longer exports `MaintainPartitionsAction`, `PruneRecordsAction` or their input and
output schemas; `.` adds `maintainAllPartitions(now)` and `pruneAllRecords(now)`, the work those jobs call.

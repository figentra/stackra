---
"@stackra/gen": patch
---

A service that runs `@stackra/outbox` now connects the outbox writer as the native-write watcher in its generated
`boot` (`connectNativeWriteWatcher`), so a native `CrudService` write (increment, soft or archive delete, restore,
repath, purge) reaches the change log, and search indexes, segments and `@ConsumesChanges` consumers no longer keep
stale or deleted rows (STA-2047).

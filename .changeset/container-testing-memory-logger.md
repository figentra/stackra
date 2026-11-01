---
"@stackra/container": patch
---

The testing module binds a `MemoryLoggerFake` (exported from `./testing`) to `Logger` when the test overrides none
and no registered wiring lists a Logger driver, so a driver that logs boots in a member that does not depend on
`@stackra/logger`; its `lines` hold what was logged.

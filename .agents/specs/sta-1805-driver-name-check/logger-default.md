# Addendum: a default Logger in the testing module

**Linear**: STA-1805 (billing round 3, item 4a; stackra-8a asked core-3b to take it with item 3)

**Input**: `billing-service-entitlements`' 23 tests stop at `UnresolvedPortError: No driver is bound to Logger`: its
`records` ModuleInstalls driver takes `Logger`, and the testing boot binds none because the member does not depend on
`@stackra/logger`, the package that ships Logger's only driver.

## Impact

- **Packages touched**: `packages/foundation/container` (testing entry: `MemoryLoggerDriver`, the builder's compile)
- **Tenancy, data, secrets, events**: none
- **ADR needed**: no (ADR 0266, memory first; the testing module already falls back for `Clock` through the container)
- **Change risk**: R1 (testing entry only; production boot unchanged)

## Requirements

- **FR-L1** `compile()` overrides `Logger` with a `MemoryLoggerDriver` when the test overrides none and no registered
  wiring lists a driver for `Logger`; a wiring that does keeps its own.
- **FR-L2** `MemoryLoggerDriver` records each line (level, event, fields) in `lines`, so a test can read what was logged.
- **FR-L3** Tests: an app whose wirings give Logger no driver compiles and logs to the memory driver; an override wins.

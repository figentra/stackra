---
"@stackra/actions": minor
"@stackra/gen": patch
---

Tests on `useDrivers("memory")` no longer need per-test overrides for two fail-closed ports and for seeders' services (os#256).

- **`@stackra/actions/testing`:** the testing plugin now offers a memory `RateLimitStore` (`MemoryRateLimitStoreDriver`) and a memory `JobDispatcher`. The new `MemoryJobDispatcherDriver` keeps every queued job in `jobs` and runs none.
  - Production still fails closed: these bind only in a testing module, and only when the test picks "memory".
  - `ApprovalGate` is left out on purpose. An action that declares `approval` fails closed without a real gate and its binding store (ADR 0509), so a test that runs one binds `MemoryApprovalGateDriver.of(...)` and `MemoryApprovalBindingStoreDriver` itself.
- **gen:** a service that only a seeder injects is now wired. Example: a minimal seeder's `SettingsPackService`. Before, `.seed(XMinimalSeeder)` failed with "Nothing binds SettingsPackService".

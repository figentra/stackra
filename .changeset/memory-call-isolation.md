---
"@stackra/tenancy": patch
"@stackra/gen": patch
---

Memory-tier tests now run actions in the actor's tenant, as production does, so `runAsTenant` wraps around `run()`
become optional. Under `createTestingModule(...).useDrivers("memory")` the tenancy testing plugin binds
`MemoryCallIsolationDriver` as `CallIsolation`: a `BelongsToTenant` row built inside the call carries the actor's
tenant before it is flushed. An actor with no tenant stays a platform call. Inside `runAsTenant(T)`, an actor of
another tenant is refused with `TenantSwitchRefusedError`, as the real driver refuses a tenant switch. An explicit
`.override(CallIsolation, …)` still wins. The driver is test-only: production wiring never lists it. Gen's Vitest setup
now loads `@stackra/tenancy/testing` for a member on `@stackra/tenancy`, as it loads the database and clients testing
entries.

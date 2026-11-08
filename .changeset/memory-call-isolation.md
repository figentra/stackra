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

**Upgrading.** A product's memory-tier tests now run each action inside its actor's tenant, so a test that relied on
no isolation can fail after the bump:

- Arrange each tenant's rows under that tenant: `await runAsTenant(tenantA, () => Factory.new().create(...))`, then
  `runAsTenant(tenantB, …)` for B's rows. A row built inside `runAsTenant(A)` by an actor of B is refused
  (`TenantSwitchRefusedError`), and a row whose `tenantId` differs from the `runAsTenant` tenant throws.
- Call `run(Action, input, { as: actor })` outside any `runAsTenant`, or inside the actor's own tenant. A
  `runAsTenant(tenant, () => run(...))` wrap around an action of that same tenant still works but is no longer needed.
- `drainOutbox()` delivers each event in its actor's tenant. Call it outside `runAsTenant`: inside `runAsTenant(T)`, an
  event of another tenant is refused in the memory tier (production's own transaction would not refuse it).

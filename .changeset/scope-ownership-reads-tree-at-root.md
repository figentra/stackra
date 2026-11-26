---
"@stackra/tenancy": patch
"@stackra/workflow": patch
---

`TenantScopeOwnershipDriver` now reads the scope tree from the root of the scope's path, as `CallIsolationDriver` does. With the Postgres scope tree, its row security shows no node outside a scope session and only a branch's own subtree inside one, so the check answered "not held" for tenant actors: the inbox downgraded every tenant sender to the platform actor (and logged `outbox.actor_downgraded` for each receipt), and the approval executor and an automation's release, which ask the same question outside a scope session or inside a branch's, could refuse a requester or principal of the scope's own tenant. The driver now takes the `Database` as its second dependency (the generated wiring passes it); a hand-built `new TenantScopeOwnershipDriver(tree)` becomes `new TenantScopeOwnershipDriver(tree, database)`.

New integration tests prove, on real Postgres row security and the real `CallIsolationDriver`, that a queued job, an outbox relay delivery, a cross-app fan-out, an inbox receipt and a workflow step each see only their own tenant's rows, refuse a unit whose actor and scope name different tenants, and leave no `app.*` setting or role on the pooled connections they used (STA-1717).

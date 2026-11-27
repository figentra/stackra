---
"@stackra/tenancy": minor
"@stackra/workflow": patch
---

**Breaking for anyone who builds `TenantScopeOwnershipDriver` by hand: its constructor now requires the `Database`.** `@stackra/tenancy` is still 0.x (and every `@stackra/*` package shares one fixed version), so this ships as a minor bump. The `ScopeOwnership` port and `holds(actor, scope)` are unchanged.

### Compatibility

- **Before:** `new TenantScopeOwnershipDriver(tree)`. **After:** `new TenantScopeOwnershipDriver(tree, database)`, where `database` is the member's connected `Database` (`@stackra/database`).
- **Generated wiring:** the tenancy manifest's `ScopeOwnership` entry now lists `Database` as the driver's second dependency. Run `stackra gen` after upgrading so the wiring passes it. The member must bind a `Database`; every member that runs the inbox, the approval executor or automations already does.
- **If you upgrade without regenerating:** `stackra gen --check` (the template's `gen:check`, run by its pre-commit hook and CI) reports the wiring stale, and a hand-built driver fails to type-check (`Expected 2 arguments, but got 1`). A member that ships the stale wiring anyway fails closed: the check throws for every tenant actor, so no tenant actor is trusted wrongly, but inbox receipts, approvals and automation releases from tenant actors fail until the wiring passes the database. Platform actors are unaffected.

### What changed

`TenantScopeOwnershipDriver` now reads the scope tree from the root of the scope's path, as `CallIsolationDriver` does. With the Postgres scope tree, its row security shows no node outside a scope session and only a branch's own subtree inside one, so the check answered "not held" for tenant actors: the inbox downgraded every tenant sender to the platform actor (and logged `outbox.actor_downgraded` for each receipt), and the approval executor and an automation's release, which ask the same question outside a scope session or inside a branch's, could refuse a requester or principal of the scope's own tenant.

New integration tests prove, on real Postgres row security and the real `CallIsolationDriver`, that a queued job, an outbox relay delivery, a cross-app fan-out, an inbox receipt and a workflow step each see only their own tenant's rows, refuse a unit whose actor and scope name different tenants, and leave no `app.*` setting or role on the pooled connections they used (STA-1717).

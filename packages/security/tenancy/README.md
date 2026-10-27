# @stackra/tenancy

Stackra tenancy: tenant isolation in Postgres, the tenant level of the scope tree, and the client's tenant switcher
(ADR 0239, 0327 d8). It is the one package where the word "tenant" is declared (ADR 0323, R-59); every other package
speaks of a `ScopeRef` or uses the names exported here.

**Tier:** `tier:lib` (`packages/security/tenancy`). Entries `.`, `./node`, `./react` and `./testing`. Depends on
`@stackra/container`, `@stackra/contracts`, `@stackra/database`, `@stackra/errors`, `@stackra/model`,
`@stackra/scheduler` (its `./contracts` only, for the `CronScopes` port) and `@stackra/scope`.

A tenant is the scope node at the tenant level, and its tenant id is that node's public id (`scp_…`). The scope tree is
`@stackra/scope`'s; tenancy adds its level as data and keeps row isolation.

## What is here

| Entry       | Symbol                                                           | Use                                                                      |
| ----------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `.`         | `TenantSwitcher`                                                 | the client's memberships, active tenant and switch                       |
| `.`         | `TenancyScopes`, `TENANT_SCOPE_LEVEL`                            | the tenant level's code and the level a deployment adds to `ScopeConfig` |
| `.`         | `TENANT_SCOPE_ALIAS`                                             | the level's lang key (`tenancy::levels.tenant`)                          |
| `.`         | `TenantScopeResolverDriver`                                      | the tenancy step of the scope resolver chain                             |
| `.`         | `TenancyCronScopesDriver`                                        | the scheduler's `CronScopes`: a per-scope cron runs for every tenant     |
| `.`         | `isTenantId`                                                     | whether a string is a tenant id                                          |
| `.`         | `TenantRequiredError`, `TenantMembershipMissingError`            | refusals                                                                 |
| `.`         | `TenantEnvironment`, `SandboxTenantService`                      | live or sandbox; register, list, retire a live tenant's sandboxes        |
| `.`         | `SandboxTenants`, `MemorySandboxTenantsDriver`                   | the sandbox store port and its memory driver                             |
| `.`         | `TenantShareService`, `ShareStatus`, `RevokedCopy`               | consented cross-tenant shares: propose, accept, revoke, flow, release    |
| `.`         | `TenantShares`, `TransferCheck`, `MemoryTenantSharesDriver`      | the share store, the cross-region transfer rules, the memory store       |
| `.`         | `revocationPlan`                                                 | keep (severed) or delete each received copy on revocation                |
| `.`         | `TenantTokenService`, `TenantTokens`, `MemoryTenantTokensDriver` | anonymous tenant resolution by token (an iCal feed, a public link)       |
| `.`         | `TenantBillingContacts`, `MemoryTenantBillingContactsDriver`     | who a tenant's billing messages go to                                    |
| `./node`    | `BelongsToTenant`                                                | the trait of a tenant-owned model (`tenantId`)                           |
| `./node`    | `BelongsToTenantOrPlatform`                                      | the nullable form: `tenantId` or `null` for a platform row               |
| `./node`    | `BelongsToTenantMacro`                                           | `t.belongsToTenant()`: the column and the equality policy                |
| `./node`    | `TenantIsolationService`                                         | `withTenant(actor, work)`: `app.tenant_id` for one unit of work          |
| `./react`   | `useTenant`, `useTenantSwitcher`                                 | the active membership; the memberships and the switch                    |
| `./react`   | `TenantMembership`                                               | one membership: tenant id, path, name, roles                             |
| `./testing` | `fakeTenantId`, `tenantActor`, `runAsTenant`                     | a fresh tenant id, a tenant user, a tenant call without a database       |

## Sandbox tenants

A sandbox is a tenant of its own, linked to the live tenant it promotes to (ADR 0280). `SandboxTenantService` registers
the link (never from another sandbox), lists the sandboxes in use, answers `environmentOf` for the environment banner
and retires one. How many sandboxes a plan allows is a limit entitlement on the creating action; promotion copies
configuration and never keys, in the OS tenancy and settings services. A membership may carry `environment`.

## Cross-tenant shares

A share joins one record of tenant A to one of tenant B; one proposes, the other accepts, either revokes (ADR 0343).
Items travel as copies in the receiver's own tables. Inside one region, `flows(share, kind)` says whether an update may
travel by events; across regions the sender releases each item and `TransferCheck` (the legal entity's transfer rules,
market-pack data) must allow it. On revocation `revocationPlan` keeps or deletes each copy by the share's terms and
never deletes a held copy.

## Two layers of isolation

The database layer: every tenant-owned table is created with `t.belongsToTenant()`.

```ts
schema.create("orders", (t: Blueprint) => {
  t.hasPublicId("ord");
  t.belongsToTenant(); // tenant_id varchar(33) not null, idx_orders_tenant_id, ENABLE + FORCE + pol_orders_tenant_id
  t.timestamps();
});
```

The policy is equality only (ADR 0239): `tenant_id = current_setting('app.tenant_id')`. An unset or `''` setting
matches no row, so a forgotten `withTenant` returns zero rows. A table takes this one policy. Making an existing table
tenant-owned is a backfill migration with its own expand and contract steps (rule `tenancy`, point 5); the compiler
refuses the bare call on `schema.table`.

The application layer: every call on a tenant-owned table runs inside `withTenant`, with the tenant of the verified
caller, never one from a body, a query or a client header.

```ts
await database.withScope(scope, () =>
  tenancy.withTenant(actor, () => pipeline.execute(type, input, { actor })),
);
```

`withTenant` opens a transaction (a savepoint inside one) and sets `app.tenant_id` to `actor.scopeId`, or `''` for a
platform call. A model with `BelongsToTenant` takes that tenant when a row is created; outside a tenant call the field
stays unset and Postgres refuses the insert. A model with the trait lists `tenantId` in its `[OptionalProps]`, so
`CrudService.insert` may leave it out.

```ts
export class Order extends Model.with(HasPublicId("ord"), BelongsToTenant, Timestamps) {}
```

## Platform rows: the nullable form

A table whose rows belong to a tenant or to the platform (an inbound message on a platform account) takes
`t.belongsToTenant({ nullable: true })` and its model `BelongsToTenantOrPlatform`. A NULL `tenant_id` is the platform's.
The policy is `tenant_id IS NOT DISTINCT FROM nullif(current_setting('app.tenant_id'), '')`: a platform call
(`withTenant` with no tenant) reads and writes only the NULL rows, a tenant call only its own. The macro compiles it
through @stackra/database's `equalsOrUnset` policy match (STA-1300).

## Tenant tokens

An anonymous call (an iCal feed, a public link) has no credential to carry a tenant, and the record it opens sits in a
tenant-owned table it cannot read before the tenant is known. `TenantTokenService.issue(tenantId, purpose)` returns an
opaque `ttk_…` token; only its SHA-256 is kept in `TenantTokens` (the OS tenancy service's platform table).
`resolve(token, purpose)` answers the tenant for that purpose only, or `undefined` for a malformed, unknown, revoked or
other-purpose token; the caller then runs `withTenant` with that tenant on the anonymous actor and reads its own record.

```ts
const tenantId = await tokens.resolve(presented, "calendar.feed");
if (tenantId === undefined) throw new NotFoundError();
await tenancy.withTenant({ ...anonymous, scopeId: tenantId }, () => feeds.render(presented));
```

## Billing contacts

`TenantBillingContacts.of(tenantId)` answers who a tenant's billing messages go to: members by `principalId`, outside
addresses by `email`. The OS tenancy service implements it; notifications and billing read it instead of a delivery
setting of their own.

## The tenant level

The scope package ships `platform` and `product`. A deployment adds the tenant level, recursive so a child tenant (an
organisation's member) sits under its parent, in its `ScopeConfig` override:

```ts
// src/config/scope.config.ts of a deployment
import { ScopeConfig as BaseScopeConfig } from "@stackra/scope";
import { TENANT_SCOPE_ALIAS, TENANT_SCOPE_LEVEL, TenancyScopes } from "@stackra/tenancy";

export class ScopeConfig extends BaseScopeConfig {
  override levels = [...this.levels, TENANT_SCOPE_LEVEL];
  override aliases = { ...this.aliases, [TenancyScopes.Tenant]: TENANT_SCOPE_ALIAS };
}
```

An organisation keeps the tenant level and takes its own alias (`app::scope.organisation`).

## The resolver step

`TenantScopeResolverDriver` answers the node of `actor.scopeId` when that node is at the tenant level. A host places it
after the header and the claim and before the root (ADR 0327 d7) by overriding the scope package's chain:

```ts
// src/overrides/@stackra/scope/core/drivers/chain-scope-resolver.driver.ts
export class ChainScopeResolverDriver extends BaseChainScopeResolverDriver {
  private readonly tenant: TenantScopeResolverDriver;

  constructor(
    header: HeaderScopeResolverDriver,
    claim: ClaimScopeResolverDriver,
    root: RootScopeResolverDriver,
    tenant: TenantScopeResolverDriver,
  ) {
    super(header, claim, root);
    this.tenant = tenant;
  }

  protected override steps(): readonly ScopeResolver[] {
    const steps = super.steps();
    return [...steps.slice(0, -1), this.tenant, ...steps.slice(-1)];
  }
}
```

## Per-tenant crons

Bind `TenancyCronScopesDriver` as `@stackra/scheduler`'s `CronScopes` and an action with
`job: { cron: { perScope: true } }` runs once per tick in every tenant: the driver lists every tenant-level node below
`ScopeConfig.root` (child tenants included) through the `ScopeTree`. The tree's row-level security applies, so the
scheduler reads it from the root's session.

## The switcher

The identity package hands the session's memberships to `TenantSwitcher.setMemberships`. The switcher keeps the active
tenant while it is still a membership, else takes the first. `switchTo(tenantId)` makes the tenant active and its node
the active scope (`ActiveScopeService`), so the generated client sends its path as `X-Scope-Path`; the server drops a
path outside the caller's grants. An app's own rule (wait for queued writes, remember the choice per user) wraps it.

```tsx
const current = useTenant({ optional: true });
const { memberships, switchTo } = useTenantSwitcher();
```

`useTenant()` without `optional` refuses `tenant_required` while no tenant is active.

## Testing

```ts
const switcher = new TenantSwitcher(new ActiveScopeService());
switcher.setMemberships([membership]);
```

`withTenant` needs a `Database`; a unit test fakes `transaction` and `em().execute`. `@stackra/tenancy/testing` gives
a fresh tenant id, a tenant user and a tenant call without a database:

```ts
import { fakeTenantId, runAsTenant, tenantActor } from "@stackra/tenancy/testing";

const tenantId = fakeTenantId();
const ticket = runAsTenant(tenantId, () => new Ticket()); // ticket.tenantId === tenantId
await tenancy.withTenant(tenantActor(tenantId), work);
```

`runAsTenant` sets no `app.tenant_id`, so it proves nothing about isolation; an isolation test runs `withTenant` on a
database.

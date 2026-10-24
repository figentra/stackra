# Feature Specification: `@stackra/tenancy` wave 5, tenant isolation and the switcher

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/tenancy` (security, wave 5, registry row "Tenancy runtime, RLS predicate, switcher"): tenant
isolation in Postgres (the `BelongsToTenant` trait, the `t.belongsToTenant()` macro with its generated equality policy,
`withTenant`), the tenant level contributed to the scope tree as data, the tenancy step of the scope resolver chain,
and the client's `TenantSwitcher` with `useTenant` and `useTenantSwitcher`.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's apps and services adopt it once converted, STA-344)
- **Packages touched**: `packages/security/tenancy` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no table of its own. Every tenant-owned table gets `tenant_id varchar(33) not null`, ENABLE and
  FORCE row-level security and the equality policy `pol_<table>_tenant_id` on `app.tenant_id` from the macro;
  `withTenant` sets the setting from the verified caller; the only package that declares tenant vocabulary (R-59)
- **Secrets**: none
- **ADR needed**: no (ADR 0327 d8, 0239, 0323, 0321 and 0210 decide it)
- **New dependencies**: none outside the workspace and the catalogs; runtime edges to container, contracts, database,
  errors, model and scope
- **Deploy modes**: same code in all
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/security/tenancy/README.md`, `packages/security/tenancy/AGENTS.md`; ADR 0327, 0323, 0321, 0239 and 0210 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R3 (tenant isolation: the policy and the setting every tenant-owned table relies on)

## Clarifications

### Session 2026-10-24

The package follows ADR 0327 d8, ADR 0239, the v3.1 registry row and the owner decisions of 2026-10-24 (programming
model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- ADR 0327 d8 and 0239: row isolation stays here, as equality on `tenant_id`; the scope tree is not used for rows
- A tenant is the scope node at the tenant level, and its tenant id is that node's public id (`scp_…`), so tenancy
  maps each tenant to a node (0327 d8) with no table of its own; `tenant_id` is `varchar(33)` like every public id
- ADR 0321 and 0323 d3, R-59, R-61: `BelongsToTenant` is exported here (from `./node`), made with the model package's
  `createTrait`; the tenant level is contributed as data (`TenancyScopes`, `TENANT_SCOPE_LEVEL`, `TENANT_SCOPE_ALIAS`)
- ADR 0327 d7: the tenancy step sits after the header and the claim and before the root; a host inserts it through its
  override of `ChainScopeResolverDriver.steps()`
- ADR 0347 (restrictive layering) is only planned: one permissive policy per table, as the database package builds it
- No `./contracts` and no `src/config/`: no port or configuration of this package's own (one symbol, one entry)
- `TenantMembership` is declared in `src/core/types/` for the switcher and exported from `./react` only

## User Scenarios & Testing

### User Story 1 - Isolate a tenant-owned table (Priority: P1)

A module's migration calls `t.belongsToTenant()` and its model takes `BelongsToTenant`; every call runs inside
`withTenant(actor, work)`, so a session sees and writes only its tenant's rows.

**Independent Test**: `src/node/database/macros/__tests__/belongs-to-tenant.macro.test.ts`, `src/node/services/__tests__/tenant-isolation.service.test.ts`, `src/node/traits/__tests__/belongs-to-tenant.trait.test.ts`.

**Acceptance Scenarios**:

1. **Given** a created table with `t.belongsToTenant()`, **When** the migration compiles, **Then** it has a NOT NULL,
   commented, indexed `tenant_id`, ENABLE, FORCE and the equality policy on `app.tenant_id`.
2. **Given** an actor in a tenant, **When** `withTenant` runs work, **Then** `app.tenant_id` is that tenant for the
   transaction and a new tenant-owned row takes it.
3. **Given** an actor in no tenant, **When** `withTenant` runs work, **Then** the setting is `''` and no tenant row is
   visible.

### User Story 2 - Add the tenant level as data (Priority: P1)

A deployment appends `TENANT_SCOPE_LEVEL` to its `ScopeConfig` levels and sets `TENANT_SCOPE_ALIAS`; tenants nest under
a product and under each other with no code change in the scope package.

**Independent Test**: `src/core/constants/__tests__/tenant-scope-level.constant.test.ts`, `src/core/constants/__tests__/tenant-scope-alias.constant.test.ts`.

### User Story 3 - Resolve a request to the caller's tenant (Priority: P2)

With no granted header and no claim, the chain answers the node of `actor.tenantId` before falling back to the root.

**Independent Test**: `src/core/drivers/__tests__/tenant-scope-resolver.driver.test.ts`.

### User Story 4 - Switch tenants on a client (Priority: P1)

The console's switcher calls `useTenant({ optional: true })` and `useTenantSwitcher()`; the mobile layout injects
`TenantSwitcher` and calls `switchTo`.

**Independent Test**: `src/core/services/__tests__/tenant-switcher.service.test.ts`, `src/react/tenant/__tests__/use-tenant.test.tsx`, `src/react/tenant/__tests__/use-tenant-switcher.test.tsx`.

### Edge Cases

- An insert outside a tenant call: `tenantId` stays unset and Postgres refuses it (NOT NULL); a value from input that
  names another tenant fails the policy's WITH CHECK.
- `t.belongsToTenant()` on an existing table: refused by the compiler; tenancy is added by a backfill migration.
- A second policy on a tenant-owned table: refused, as Postgres ORs permissive policies.
- An `actor.tenantId` that is not a scope node's id: refused before a transaction opens (a wiring error).
- A switch to a tenant the user is not a member of: refused, nothing changes.
- A membership refresh without the active tenant: the first membership becomes active; none clears it.

## Requirements

- **FR-001**: The package SHALL be `@stackra/tenancy` at `packages/security/tenancy`, `tier:lib`, entries `.`, `./node`
  and `./react` only.
- **FR-002**: `BelongsToTenantMacro` SHALL write `tenant_id varchar(33) not null`, commented and indexed with no foreign
  key, and ENABLE, FORCE and the policy `pol_<table>_tenant_id` that compares `tenant_id` with `app.tenant_id`.
- **FR-003**: `TenantIsolationService.withTenant(actor, work)` SHALL run `work` in a transaction after one parameterised
  `set_config('app.tenant_id', …, true)` with `actor.tenantId`, or `''` when the actor has none.
- **FR-004**: `BelongsToTenant` SHALL be a trait named `belongs_to_tenant` whose `tenantId` takes the running tenant
  call's tenant when a row is created and nothing outside one.
- **FR-005**: `TenancyScopes`, `TENANT_SCOPE_LEVEL` and `TENANT_SCOPE_ALIAS` SHALL give the recursive `tenant` level and
  its lang key, valid as `ScopeConfig` data, with labels in every shipped locale.
- **FR-006**: `TenantScopeResolverDriver` SHALL answer the node of `actor.tenantId` only when it is a tenant id whose
  node the tree shows at the tenant level, and pass otherwise.
- **FR-007**: `TenantSwitcher` SHALL hold the memberships and the active one, keep the active tenant across a refresh
  while it is still a membership, set the active scope to the tenant's node on a switch, and refuse a switch to a
  tenant outside the memberships with `TenantMembershipMissingError`.
- **FR-008**: `useTenant` and `useTenantSwitcher` SHALL read `TenantSwitcher` and re-render on a change; `useTenant()`
  without `optional` SHALL refuse `TenantRequiredError` while no tenant is active.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package, the validator reports nothing for it, and a scratch
  typecheck that maps the workspace imports to their sources passes.

## Open items (for the owner, not blocking)

- `@stackra/model` still exports its own `BelongsToTenant` (`tenantId: string`, no fill), from before ADR 0321; it should
  be removed there and the template's models import the trait from `@stackra/tenancy/node` (STA-344).
- The tenant id is the tenant node's `scp_` id; `Actor.tenantId` and `CallDescriptor.tenantId` stay `PublicId` in
  contracts and actions, and the identity package's session claims carry the node's id and path for each membership.
- Not built (outside the registry row): the tenant lifecycle of ADR 0210 d2 and an actions `TenancyCheck` driver (both
  need tenant state, which the identity record holds), remembering the chosen tenant per user, and a `CacheNamespace`
  driver for `@stackra/cache`.
- The template's tenant wording outside tenancy (`SettingScope.Tenant`, `QueryScope.Tenant`, `ConnectionLevel.Tenant`,
  `X-Tenant`) is an STA-344 change; nothing is re-added to another package.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)

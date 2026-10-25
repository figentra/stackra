# Plan: `@stackra/tenancy` wave 5

**Spec**: `.agents/specs/sta-348-tenancy/spec.md`

## Design

- Three entries through stand-in barrels (STA-339 replaces them): `.` from `src/core/` (isomorphic: the switcher, the
  level data, the resolver step, the id check, the refusals), `./node` from `src/node/` (the trait, the macro with its
  `Blueprint` augmentation, the isolation service), `./react` from `src/react/` (the hooks and the membership type).
- A tenant is the scope node at the tenant level and its id is the node's `scp_` id: no table, no port, no mapping.
- `BelongsToTenantMacro.apply` composes the database package's `t.link("tenant_id")` and
  `t.rowLevelSecurity("tenant_id", { setting: "app.tenant_id", match: "equals" })`, stating nullability and comment.
- `withTenant` wraps `Database.transaction` with one parameterised `set_config` and runs the work inside an
  `AsyncLocalStorage` that the trait's initializer reads, so a new row takes the call's tenant.
- `TenantSwitcher` is a small subscribable store over the memberships; it drives the scope package's
  `ActiveScopeService`, so the client sends the tenant's path as `X-Scope-Path`. The hooks read it through
  `useSyncExternalStore`.
- `TenantScopeResolverDriver` is one more `ScopeResolver` step; the host override inserts it before the root.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                     |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/security/tenancy`; imports only `tier:lib` packages; no app, service or `encore.dev`                             |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                      |
| Security                              | PASS   | the tenant comes from the verified actor, never input; unset setting means no rows; a switch outside the memberships is refused          |
| HTTP and events                       | PASS   | no endpoint or event; no tenant header (the one client header is `X-Scope-Path`)                                                         |
| Tenancy                               | PASS   | ENABLE, FORCE and a generated equality policy per tenant-owned table; `withTenant` sets `app.tenant_id`; no application filter (0327 d9) |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                   |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology                                                                                                       |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                        |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                                                |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                       |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0327 and 0239 stand, the open items are listed in the spec                                 |

- Boundaries: runtime imports of container, contracts, database, errors, model and scope; dev-only `@stackra/config`,
  `@stackra/testing`, the tooling presets and the React test libraries.
- Versions: catalogs and `workspace:*` only.
- Naming: the macro `<Name>Macro`, the driver `<Name>Driver`, the service `TenantIsolationService`, refusals end in
  `Error`; `TenantSwitcher` keeps the template's name.

## Properties

- **P-001**: `package.json` names `@stackra/tenancy` at `packages/security/tenancy` and `exports` lists only `.`, `./node` and `./react` — Validates: FR-001
- **P-002**: for every table created with `t.belongsToTenant()`, the compiled SQL holds `"tenant_id" varchar(33) not null`, `idx_<table>_tenant_id`, ENABLE, FORCE and `pol_<table>_tenant_id` comparing with `app.tenant_id`, and no foreign key — Validates: FR-002
- **P-003**: for every actor, `withTenant` issues exactly one `set_config('app.tenant_id', tenantId ?? '', true)` inside one transaction before the work — Validates: FR-003
- **P-004**: a model created inside `withTenant` for tenant T has `tenantId` T, one created outside has none, and concurrent calls never mix — Validates: FR-004
- **P-005**: a `ScopeConfig` with `TENANT_SCOPE_LEVEL` appended builds, `childLevelsOf` gives `tenant` under `product` and under `tenant`, and every shipped catalogue holds `levels.tenant` — Validates: FR-005
- **P-006**: the step's answer is the tree's node of `actor.tenantId` exactly when that id is a tenant id and the node's level is `tenant` — Validates: FR-006
- **P-007**: after any sequence of `setMemberships` and `switchTo`, the active membership is one of the memberships or `null`, and the active scope is its node — Validates: FR-007
- **P-008**: the hooks render the switcher's current state after every change, and `useTenant()` refuses `tenant_required` with no active tenant — Validates: FR-008
- **P-009**: for every tree, `list()` is exactly the descendants of the root whose level is `tenant`, as `{ id, path }`, and empty when the tree shows no root — Validates: FR-009

## Deploy modes

| Mode       | Behaviour                                                                     |
| ---------- | ----------------------------------------------------------------------------- |
| SaaS       | the same build; the identity package hands the switcher its memberships       |
| On-prem    | identical: the same build, no SaaS-only code path                             |
| Air-gapped | identical: needs no network; isolation lives in the deployment's own Postgres |

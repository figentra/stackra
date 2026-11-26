# AGENTS — @stackra/tenancy

Tenant isolation (the trait, the macro and its equality policy, `withTenant`), the tenant level of the scope tree as
data, the tenancy step of the resolver chain, and the client's tenant switcher (ADR 0239, 0327 d8). Member at
`packages/security/tenancy` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./node`,
`./react`, `./testing`.

## Where code goes

| You are writing…                                    | It goes in…                                    |
| --------------------------------------------------- | ---------------------------------------------- |
| An isomorphic enum, constant, function or type      | `src/core/{enums,constants,functions,types}/`  |
| A refusal                                           | `src/core/errors/`                             |
| The client switcher, a resolver step, a port driver | `src/core/{services,drivers}/`                 |
| The trait                                           | `src/node/traits/`                             |
| A migration macro and its `Blueprint` augmentation  | `src/node/database/macros/`, `src/node/types/` |
| A server service, an internal server constant       | `src/node/{services,constants}/`               |
| A hook                                              | `src/react/tenant/`                            |
| A label                                             | `assets/lang/{en,ar}/tenancy.json`             |
| A port and its type (tokens, billing contacts)      | `src/core/{ports,types}/`                      |
| A test helper                                       | `src/testing/functions/`                       |
| A test                                              | `__tests__/<name>.<kind>.test.ts` beside it    |

## Entries and barrels

- `src/{core,node,react,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new
  public file to its barrel and to that entry's `index.test.ts`.
- `node` and `react` import `core` through `#core/index`; `react` also re-exports `TenantMembership` from its declaring
  file, which `.` does not export (one symbol, one entry).
- No `./contracts` entry: the ports this package uses are `@stackra/scope`'s and `@stackra/scheduler`'s
  (`CronScopes`). Add one only with a port of its own. Import scheduler through `./contracts` only; scheduler must
  never depend on tenancy.

## This package

- The only package that declares a `tenant` identifier (ADR 0323, R-59). Never add tenant vocabulary to another
  package; a scope there is a `ScopeRef`.
- A tenant is the scope node at the tenant level; its tenant id is that node's `scp_` id. No mapping table.
- Isolation is the database's: equality on `tenant_id` only, no tree logic in a policy (ADR 0239), no application
  `WHERE` filter (ADR 0327 d9).
- The tenant comes from the verified `Actor`, never from input. `X-Scope-Path` is the one client header; there is no
  tenant header.
- `CallIsolationDriver` (`./node`, the pipeline's and every background unit's `CallIsolation`, ADR 0495) composes
  `Database.withScope` and `withTenant` and writes no SQL of its own; a read-only call opens one read-only
  transaction around both, unless one is already running; inside a running transaction set to another tenant it
  refuses (`TenantSwitchRefusedError`), so the relay and the inbox give each unit a transaction of its own. For a
  single scope the driver resolves the tenant through the `ScopeTree` first (STA-1823, ADR 0495 note of 2026-11-01): a
  `job` or `system` actor takes the tenant of its platform-written scope (`tenantOf`, a branch resolves to its parent
  tenant; a scope the tree does not show is refused, `TenantScopeUnresolvedError`); any other actor keeps its own
  `scopeId` and is refused (`TenantScopeMismatchError`) when the scope's tenant differs; a user with a tenant, or an agent
  or a service with one (its own, or else its user's), is also refused in a scope above every tenant or one the tree
  does not show (never fail open on an unknown scope); a platform user, agent or service (no tenant) stays a platform
  call. An agent or a service with no `scopeId` of its own runs in the tenant of the user it acts for (`actingScopeId`,
  used by both `withTenant` and the driver), and one whose own tenant differs from that user's is refused (ADR 0209,
  amendment of 2026-11-07, condition 3). Every tenant a user, agent or service claims is read through the tree
  (`tenantOf`), so a branch stands for its tenant and the isolation runs as the tenant; a claimed scope the tree does
  not show, or one above every tenant, is refused, and a tree read that fails fails the call. Never compare raw
  `scopeId`s for these kinds. The tree is read in a session
  over the root label of the scope's path, because row security hides a branch's tenant ancestor from the branch's own.
  `TenantScopeOwnershipDriver` is the `ScopeOwnership` the inbox and the automation service use to distrust an actor
  whose tenant does not own the scope it comes with. `pnpm validate` refuses a session-level `app.*` setting
  anywhere else (`stackra validate --repository`).
- Raw SQL lives only in `TenantIsolationService.withTenant` (one parameterised `set_config`), with a `// raw-sql:`
  comment (ADR 0160).
- A sandbox or a share is never a grant and never a tree position. Transfer rules, sandbox allowances and the terms of
  an item kind are data (market packs, plan catalogue, the share); never name a law, country or number here.
- `BelongsToTenantOrPlatform` and `t.belongsToTenant({ nullable: true })` compile through @stackra/database's
  `equalsOrUnset` match (STA-1300); never fall back to a hand-written policy or a second one.
- A tenant token is stored by its SHA-256 only and resolves for its one purpose; never log or store the token itself.
- `./testing` imports `./node` internals only, never another package's `./testing`.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.
- Placement (stackra-310): a tenant's `region` and `cell` come only from the `TenantPlacement` port (the tenant
  registry's row); the deployment's region only from `DatabaseConfig.region` (runway data). Never hard-code a region
  key or a cell, and never let the region guard or the placement resolver pass or fall back when a placement is
  missing: both fail closed.
- `asTenant(tenantId, work)` (`./testing`) runs the real isolation on the current database; `runAsTenant` fills the
  trait and sets `app.tenant_id` transaction-locally in each transaction started inside it (its subscriber, the one
  testing path on the session-setting allow list), so setup rows pass the policy; it never proves isolation. Isolation is proven on real Postgres in `*.int.test.ts` (`pnpm --filter @stackra/tenancy test:int`,
  Docker), as a role that is neither the owner nor `BYPASSRLS`.
- `tenantIsolationOptions()` (`./testing`, stackra-258) is data for `@stackra/database/testing`'s
  `assertRowSecurity`; this entry never imports another package's `./testing`, so the generated test joins them.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data            | Where                             | Handling                                                         |
| --------------- | --------------------------------- | ---------------------------------------------------------------- |
| Tenant name     | `TenantMembership.name`           | An organisation's display name, not personal data; never logged. |
| Roles           | `TenantMembership.role`, `.roles` | Role codes from the session; read, never stored or computed.     |
| Caller          | `withTenant(actor, …)`, the step  | Public ids from the verified credential; never stored or logged. |
| Billing contact | `TenantBillingContact`            | A member id or an email address; read to send, never logged.     |
| Tenant token    | `TenantTokenService`              | A bearer secret: only its SHA-256 is stored; never logged.       |

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
- Raw SQL lives only in `TenantIsolationService.withTenant` (one parameterised `set_config`), with a `// raw-sql:`
  comment (ADR 0160).
- A sandbox or a share is never a grant and never a tree position. Transfer rules, sandbox allowances and the terms of
  an item kind are data (market packs, plan catalogue, the share); never name a law, country or number here.
- `BelongsToTenantOrPlatform` and `t.belongsToTenant({ nullable: true })` compile through @stackra/database's
  `equalsOrUnset` match (STA-1300); never fall back to a hand-written policy or a second one.
- A tenant token is stored by its SHA-256 only and resolves for its one purpose; never log or store the token itself.
- `./testing` imports `./node` internals only, never another package's `./testing`.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

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

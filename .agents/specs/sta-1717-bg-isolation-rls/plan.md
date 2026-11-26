# Implementation Plan: tenancy: the scope ownership reads the scope tree from the root, proven with the background units on real Postgres row security

**Spec**: `.agents/specs/sta-1717-bg-isolation-rls/spec.md` · **Linear**: STA-1717 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-1717-bg-isolation-rls/spec.md`

## Summary

`CallIsolationDriver`'s private root-label tree read moves into `readTreeAtRoot(database, at, read)` in tenancy's
core, and `TenantScopeOwnershipDriver` reads the tree through it. The driver therefore takes the `Database` as a second
constructor dependency, and the tenancy manifest wires it. Two integration suites prove the background units isolated
on real Postgres row security.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/security/tenancy`, `packages/runtime/workflow` (tests only)
- **Testing**: vitest; unit tests in `src/**/__tests__/`; `.int` tests on Postgres as a NOBYPASSRLS role (ADR 0022,
  tenancy rule 8)
- **Storage**: none new (the tests create their own databases)
- **Runtime target**: every member that binds `ScopeOwnership` (inbox, approval executor, automation release)

## Constitution Check

| Law                                   | Result | Note                                                                   |
| ------------------------------------- | ------ | ---------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | tenancy already depends on `@stackra/database`; dev dependencies only  |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                             |
| Security                              | PASS   | ownership answers per ADR 0495 decision 2 under row security           |
| HTTP and events                       | N/A    | no endpoint or event shape changes                                     |
| Tenancy                               | PASS   | tree read rolled back; isolation proven on real row security (rule 8) |
| Delegation                            | PASS   | one session, two members                                               |
| Not built yet (ADR 0011)              | N/A    | nothing from the table                                                 |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/` beside their subjects                            |
| Versions and catalogs                 | PASS   | patch changesets for tenancy and workflow; workspace dev dependencies  |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                      |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                              |
| Docs and ADRs                         | PASS   | tenancy AGENTS.md paragraph; implements ADR 0495, no new ADR           |

## Deploy modes

| Mode       | Behaviour                                                            |
| ---------- | -------------------------------------------------------------------- |
| SaaS       | tenant senders trusted in their tenant; regenerated wiring on deploy |
| On-prem    | the same, after `stackra gen` in the upgrade                         |
| Air-gapped | the same; no network involved                                        |

## Correctness properties

- **P-001**: For any tenant actor and scope, `holds` reads the tree inside exactly one scope session whose path is the
  scope path's root label, and no session stays open after it answers — Validates: AC-001, AC-004
- **P-002**: `holds(actor, scope)` is true exactly when the actor has no tenant, or `tenantOf(tree, scope)` equals the
  actor's `scopeId`, whatever session the caller holds — Validates: AC-002, AC-003
- **P-003**: The manifest's `ScopeOwnership` dependency list matches the driver's constructor parameters in order —
  Validates: AC-005
- **P-004**: Under `CallIsolationDriver` as a NOBYPASSRLS role, every row a background unit reads or writes carries the
  unit's tenant, and a unit whose actor and scope name different tenants never reaches its handler — Validates:
  AC-006, AC-007, AC-008
- **P-005**: After any unit, every pooled connection reports no `app.*` setting and `current_user` equals the login
  role — Validates: AC-009

## Architecture overview

`ScopeOwnership` (port, `@stackra/actions/contracts`) is asked by the inbox, the approval executor and an
automation's release whether an actor's tenant owns a scope. Its tenancy driver resolves the scope's tenant with
`tenantOf(tree, scope)`. Under the Postgres scope tree, that read must run in a scope session that can see the tenant
ancestor. `CallIsolationDriver` already solved this privately (`inTree`): a `database.withScope` over the root label,
whose work throws a private symbol so the savepoint rolls back. That logic becomes `readTreeAtRoot`, used by both
drivers.

## Components and responsibilities

- `readTreeAtRoot` (tenancy core, new): runs `read` in `database.withScope({ id, path: rootLabel })`, captures the
  answer, rolls the session back, rethrows a real failure, never leaks the roll-back symbol.
- `TenantScopeOwnershipDriver` (tenancy core, changed): constructor `(tree, database)`; `holds` short-circuits a
  platform actor (true) and an absent scope (false) without a session, otherwise compares `readTreeAtRoot(...)`'s
  tenant with `actor.scopeId`.
- `CallIsolationDriver` (tenancy node, changed): `inTree` delegates to `readTreeAtRoot`; behaviour unchanged.
- `stackra.manifest.json` (tenancy, changed): `Database` added to the `ScopeOwnership` entry's deps.
- `ownerPostgres` fixture (workflow tests, changed): optional `{ pool }` cap so a test can inspect every connection.

## Files and folders

```text
.changeset/
  scope-ownership-reads-tree-at-root.md
packages/security/tenancy/
  AGENTS.md
  package.json
  stackra.manifest.json
  src/core/functions/read-tree-at-root.function.ts
  src/core/drivers/tenant-scope-ownership.driver.ts
  src/core/drivers/__tests__/tenant-scope-ownership.driver.test.ts
  src/node/drivers/call-isolation.driver.ts
  src/node/drivers/__tests__/background-isolation.int.test.ts
  src/node/drivers/__tests__/fixtures/background-postgres.fixture.ts
packages/runtime/workflow/
  package.json
  src/node/__tests__/step-isolation.int.test.ts
  src/node/__tests__/fixtures/owner-postgres.fixture.ts
pnpm-lock.yaml
```

- `packages/security/tenancy/src/core/functions/read-tree-at-root.function.ts` (new)
- `packages/security/tenancy/src/core/drivers/tenant-scope-ownership.driver.ts` (change)
- `packages/security/tenancy/src/node/drivers/call-isolation.driver.ts` (change)
- `packages/security/tenancy/stackra.manifest.json` (change)
- `packages/security/tenancy/AGENTS.md` (change)
- `packages/security/tenancy/package.json`, `packages/runtime/workflow/package.json`, `pnpm-lock.yaml` (dev deps)
- Tests: `packages/security/tenancy/src/core/drivers/__tests__/tenant-scope-ownership.driver.test.ts` (extend),
  `packages/security/tenancy/src/node/drivers/__tests__/background-isolation.int.test.ts` (new),
  `packages/security/tenancy/src/node/drivers/__tests__/fixtures/background-postgres.fixture.ts` (new),
  `packages/runtime/workflow/src/node/__tests__/step-isolation.int.test.ts` (new),
  `packages/runtime/workflow/src/node/__tests__/fixtures/owner-postgres.fixture.ts` (change)
- `.changeset/scope-ownership-reads-tree-at-root.md` (tenancy and workflow patch)

## Data models and migrations

none. The integration fixtures create throwaway databases and apply the shipped migrations plus a test copy of
`scope_nodes`; nothing ships.

## Contracts

- `TenantScopeOwnershipDriver` constructor, before and after:

  ```ts
  // before
  new TenantScopeOwnershipDriver(tree);
  // after
  new TenantScopeOwnershipDriver(tree, database);
  ```

- Manifest `ScopeOwnership` entry `deps`: `[ScopeTree (@stackra/scope/contracts), Database (@stackra/database)]`.
- `ScopeOwnership.holds(actor, scope): Promise<boolean>`: unchanged signature; the answer for a tenant actor is now
  correct under row security.
- Compatibility: generated wiring picks up the new dependency on the next `stackra gen`; a hand-built driver fails to
  type-check until it passes the database (named in the changeset). Released as a patch: the class is wired, not
  constructed by consumers.

## Error handling

- A tree read that fails throws out of `holds` (the session's own error, or the read's); callers already treat a
  thrown ownership check as a refusal.
- `readTreeAtRoot` throws "the scope tree read did not run" if `withScope` returns without running the work.

## Security and tenancy

The root-label session grants the whole tree for one read of `scope_nodes` only, inside a savepoint rolled back before
`holds` returns, so a caller never keeps the root-label settings. No tenant-owned table is read in that session. The
answer remains ADR 0495 decision 2: a tenant actor holds only its own tenant's scopes.

## Testing strategy

- AC-001 to AC-004: `tenant-scope-ownership.driver.test.ts` with the memory tree, a fake `Database` recording each
  scope session, and a `RowSecureTree` that shows nodes only inside a session's subtree: tenant user held at a branch,
  other tenant refused, sessions opened at `platform` only, none left open, none for a platform actor or absent scope.
- AC-002, AC-003, AC-006, AC-007, AC-009: `background-isolation.int.test.ts` on Postgres as a NOBYPASSRLS role owning
  no table, two tenants and a scope tree under its own row security: the ownership driver outside and inside a branch
  session; the queue worker, outbox relay (row change and cross-app fan-out) and inbox each see only their tenant's
  tickets; mismatched job and receipt refused before handler; pooled connections clean afterwards.
- AC-008, AC-009: `step-isolation.int.test.ts` (skipped without `TESTBED_POSTGRES_HOST`): first step and tick-resumed
  steps see only their tenant; a B-user origin in A's scope never runs its step.
- Revert checks (from the PR): the ownership driver as on main turns 2 int tests and 1 unit test red; a session-level
  tenant never put back turns 7 of 11 tenancy tests red; row security off on the tickets turns 5 red.
- Touched packages' tests, typecheck, oxlint and oxfmt.

## Rollout

No flag. Patch changesets for `@stackra/tenancy` and `@stackra/workflow`. Members regenerate wiring on upgrade; until
then the old wiring fails to type-check rather than running with a wrong answer.

## Delegation and risk plan

One session, two members. Risk: a member with stale generated wiring; mitigated by the type error and the changeset
note. Review follow-ups (the `SqlScopeTree` stand-in, the workflow `.int` suite on hosted CI) are tracked out of scope.

## ADRs

ADR 0495 (decisions 1 to 3), ADR 0327 (decisions 3 and 8), ADR 0502 (this spec's tier). No draft.

## Docs

`packages/security/tenancy/AGENTS.md`; `.changeset/scope-ownership-reads-tree-at-root.md`.

## Complexity tracking

none

# Feature Specification: tenancy: the scope ownership reads the scope tree from the root, proven with the background units on real Postgres row security

**Feature Branch**: `figentra/sta-1717-bg-isolation-rls`

**Created**: 2026-11-26

**Status**: Tasked

**Tier**: feature

**Approver**: leader

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1717

**Clarifications status**: complete

**Input**: STA-1717 asks for proof that the queue worker, the outbox relay, the inbox and the workflow steps each run
isolated per tenant under the real `CallIsolationDriver` on real Postgres row security, not a stand-in isolation or a
memory queue. Writing that proof found a defect: `TenantScopeOwnershipDriver.holds` read the scope tree in whatever
scope session its caller held. The Postgres scope tree's row security (ADR 0327) shows no node outside a scope session
and only a branch's own subtree inside one, so `holds` answered "not held" for every tenant actor. The inbox then
downgraded every tenant sender to the platform actor (logging `outbox.actor_downgraded` per receipt), and the approval
executor and an automation's release could refuse a requester or principal of the scope's own tenant.

### Sources

- STA-1717; ADR 0495 (decisions 1 to 3, and the note of 2026-11-01 on reading the tree from the root label); ADR 0327
  (decisions 3 and 8); `.agents/rules/tenancy.md` rule 8
- `packages/security/tenancy/src/core/drivers/tenant-scope-ownership.driver.ts`;
  `packages/security/tenancy/src/node/drivers/call-isolation.driver.ts` (the private `inTree` read this change shares);
  `packages/application/actions/src/contracts/ports/scope-ownership.port.ts` (the port, unchanged)
- `packages/security/tenancy/stackra.manifest.json` (the `ScopeOwnership` wiring entry)

## Impact

- **Apps touched**: none
- **Services touched**: none in this repository. A member that binds `ScopeOwnership` gets the new constructor
  dependency through its regenerated wiring.
- **Packages touched**: `@stackra/tenancy` (driver, new shared function, manifest, tests); `@stackra/workflow` (an
  integration test and its fixture's optional pool cap; a dev dependency on `@stackra/scope`)
- **Public contract change**: `TenantScopeOwnershipDriver`'s constructor takes `(tree: ScopeTree, database: Database)`
  instead of `(tree)`. The tenancy manifest's `ScopeOwnership` entry lists `Database` (`@stackra/database`) as its
  second dependency, so `stackra gen` wires it. The `ScopeOwnership` port and `holds(actor, scope)` are unchanged.
  `readTreeAtRoot` is internal to `@stackra/tenancy` (not exported). A required constructor argument breaks a
  hand-built driver and stale generated wiring, so `@stackra/tenancy` ships it as a **minor** (the package is 0.x and
  every `@stackra/*` package shares one fixed version), with a compatibility note in the changeset: before and after,
  `stackra gen` for generated wiring, the `Database` binding the member needs, and what a member that ships stale wiring
  sees (it fails closed). `@stackra/workflow` stays a patch (tests and a dev dependency only).
- **Cross-service events**: none (inbox receipts from a tenant user are now trusted in their tenant instead of being
  downgraded to the platform actor)
- **Tenancy and data**: the tree read runs in a scope session over the root label of the scope's path, inside a
  savepoint rolled back after the read, so the root-label settings never outlive it. No table, policy or row changes.
- **Security and privacy**: tightens nothing and loosens nothing in policy: a tenant actor is trusted only for its own
  tenant's scopes, as ADR 0495 decision 2 already says; the fix makes that answer correct under row security.
- **Secrets**: none
- **ADR needed**: no. This implements ADR 0495 decisions 1 to 3 on a tree under ADR 0327 row security, and rule 8 of
  `.agents/rules/tenancy.md`.
- **New dependencies**: none at runtime. Dev only: `@stackra/locking` and `@stackra/outbox` in tenancy,
  `@stackra/scope` in workflow (all workspace packages)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/security/tenancy/AGENTS.md` (the ownership driver paragraph); the changeset
  `.changeset/scope-ownership-reads-tree-at-root.md` (minor, with the compatibility note)
- **Lane**: full
- **Change risk**: R2 (a shipped driver's constructor and a manifest wiring entry; security-relevant behaviour)

## Clarifications

### Session 2026-11-26

- Q: Does the port change? → A: No. `ScopeOwnership.holds(actor, scope)` keeps its signature and meaning; only the
  driver's constructor and the manifest entry that wires it change. Answered from the code.
- Q: Who constructs the driver by hand? → A: Nobody in this repository outside tests; members get it from generated
  wiring, which reads the manifest. The changeset names the hand-built migration
  (`new TenantScopeOwnershipDriver(tree, database)`).
- Q: Patch or minor? → A: Minor, with a compatibility note (CTO review of stackra#1113, 2026-11-26): a required
  constructor argument breaks consumers that build the driver by hand or ship stale wiring, so it must not arrive on a
  patch upgrade.
- Q: What does a member see if it upgrades without regenerating? → A: Generated wiring lists dependencies as tokens,
  so nothing fails to type-check there; `stackra gen --check` (the template's `gen:check`, in its hook and CI) reports
  the wiring stale. A member that ships it anyway constructs the driver without a database, and `holds` throws for
  every tenant actor: it fails closed, never trusting one wrongly. Answered from `emit-wiring` and the driver.
- Q: Why read at the root label rather than the caller's session? → A: The same reason `CallIsolationDriver` already
  does: row security hides a branch's tenant ancestor from the branch's own session and shows nothing outside one.
  The shared function keeps both readers identical.

## Acceptance criteria

- **AC-001**: WHEN `TenantScopeOwnershipDriver.holds` is asked about a tenant actor and a scope THE driver SHALL read the scope tree in a scope session over the root label of the scope's path and roll that session back after the read.
- **AC-002**: WHEN a tenant actor's own tenant owns the scope THE driver SHALL answer held, whether the caller is outside every scope session or inside a branch's.
- **AC-003**: IF a tenant actor's tenant does not own the scope or the scope sits above every tenant or no scope is given THEN THE driver SHALL answer not held.
- **AC-004**: WHEN the actor acts in no tenant, or no scope is given THE driver SHALL open no scope session.
- **AC-005**: THE tenancy manifest's `ScopeOwnership` entry SHALL list `Database` as the driver's second dependency, so generated wiring constructs it.
- **AC-006**: WHEN a queued job or an outbox relay delivery or a cross-app fan-out or an inbox receipt runs under `CallIsolationDriver` on real Postgres row security THE unit SHALL see and write only its own tenant's rows.
- **AC-007**: IF a job is queued in tenant A's call for B's scope or a receipt from a user of B arrives in A's scope THEN THE runtime SHALL refuse it before its handler or listener runs.
- **AC-008**: WHEN a workflow step runs at start or is resumed by the tick THE step SHALL see only its run's tenant, and IF a run's stored origin names a user of B in A's scope THEN THE engine SHALL never run its step.
- **AC-009**: WHEN a unit of work has finished THE pooled connection it used SHALL carry no `app.*` setting and no extra role.
- **AC-010**: IF the driver is constructed without a database (stale generated wiring) THEN THE driver SHALL throw from `holds` for every tenant actor, never answering held, and answer held for a platform actor.
- **AC-011**: THE `@stackra/tenancy` changeset SHALL be a minor bump with a compatibility note naming the constructor before and after, `stackra gen`, the `Database` binding and the stale-wiring behaviour.

## Out of scope

- Replacing the integration fixture's raw-SQL scope tree stand-in (`SqlScopeTree`) and hand-copied `scope_nodes`
  migration with the shipped `PostgresScopeTreeDriver` and `@stackra/scope`'s migration (review follow-up 1).
- Moving the workflow `.int` suite off `TESTBED_POSTGRES_HOST` to the Testcontainers helper, so hosted CI runs it
  (review follow-up 2).

## Assumptions

- Every member that binds `ScopeOwnership` regenerates its wiring with `stackra gen` on upgrade, as for any manifest
  change.
- `Database.withScope` opens a savepoint inside a running transaction and a transaction of its own outside one, as
  `CallIsolationDriver` already relies on.

## Amendments

None.

## Status history

- 2026-11-26 → Draft (STA-1717, from the PR's diff)
- 2026-11-26 → Clarified (questions answered from the code)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-26
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Tasked (T007 added: the minor release with its compatibility note, from the CTO's review of stackra#1113)

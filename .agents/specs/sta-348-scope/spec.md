# Feature Specification: `@stackra/scope` wave 5, the scope tree

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/scope` (security, wave 5, a new package from ADR 0327): the one scope tree that settings,
IAM, flags and the other configuration consumers resolve against, with levels as deployment data, nodes on an `ltree`
path, the resolver chain of a request, the depth entitlement declared, and a thin client hook.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's apps and services adopt it once converted, STA-344)
- **Packages touched**: `packages/security/scope` (new member)
- **Cross-service events**: none
- **Tenancy and data**: one table, `scope.scope_nodes`, with forced row-level security on `scope_path` against
  `app.scope_paths`; no tenant vocabulary (R-59); business-table isolation stays with its owner
- **Secrets**: none
- **ADR needed**: no (ADR 0327 decides the package; ADR 0323, 0240, 0242 and 0208 bind it)
- **New dependencies**: none outside the workspace and the catalogs (`zod` from the default catalog); runtime edges
  to config, container, contracts, database, entitlements, errors, model and validation
- **Deploy modes**: same code in all; the `GrantedScopes` driver is the IAM package's
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/security/scope/README.md`, `packages/security/scope/AGENTS.md`; ADR 0327, 0323, 0240, 0242 and 0208 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public contract settings, IAM, flags and tenancy resolve against)

## Clarifications

### Session 2026-10-24

The package follows ADR 0327, the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and
v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Owner, 2026-10-24: `ScopeRef` (`{ id: PublicId<"scp">; path: string }`) lives in `@stackra/contracts`; this package
  imports it and owns its semantics and the resolver, with no re-export (one home per symbol)
- Owner, 2026-10-24 (R-59, ADR 0323): no tenant vocabulary in this package; tenancy contributes its level as data, so
  the shipped defaults are `platform` and `product`
- The resolver chain is header (`X-Scope-Path`, accepted only within a grant), token claim, root; tenancy adds its step
  before the root as a driver (ADR 0327 d7)
- No application-level `WHERE` filter; isolation is row-level security (ADR 0327 d9)
- The depth entitlement is declared, not enforced here; the plan values are the entitlement system's data

## User Scenarios & Testing

### User Story 1 - Declare the levels as data (Priority: P1)

A deployment overrides `ScopeConfig` with `override levels = [...this.levels, { key: "store", recursive: true }]` and
an alias per level; no code or migration changes.

**Independent Test**: `src/config/__tests__/scope.config.test.ts`, `src/core/functions/__tests__/child-levels-of.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a level added as data, **When** a node is added under its parent level, **Then** it is accepted.
2. **Given** two levels with one key, **When** the configuration builds, **Then** it refuses with `ConfigInvalidError`.

### User Story 2 - Resolve the scope of a request (Priority: P1)

The transport asks `ChainScopeResolverDriver` once per request and runs the call inside `Database.withScope` with the
answer.

**Independent Test**: `src/core/drivers/__tests__/chain-scope-resolver.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** a header inside a grant and a claim, **When** the chain resolves, **Then** the header's node wins.
2. **Given** a header outside every grant, **When** the chain resolves, **Then** the header is dropped and the claim or
   the root answers.
3. **Given** no step answers, **When** the chain resolves, **Then** it refuses `scope_unresolved`.

### User Story 3 - Add and walk nodes (Priority: P1)

Tenancy adds a node with `ScopeNodeService.add`; settings reads ancestors through `ScopeTree`.

**Independent Test**: `src/node/services/__tests__/scope-node.service.test.ts`, `src/core/drivers/__tests__/memory-scope-tree.driver.test.ts`.

### User Story 4 - Read the active scope on a client (Priority: P2)

A breadcrumb calls `useScope()`; the generated client writes `ActiveScopeService.current()?.path` into `X-Scope-Path`.

**Independent Test**: `src/react/scope/__tests__/use-scope.test.tsx`.

### Edge Cases

- A malformed, empty or wildcard header: dropped, never refused, so a client cannot probe which scopes exist.
- A label that only starts like a granted one (`platform.acme_eu` beside `platform.acme`): not within the grant.
- A parent at a level no longer declared: it takes no children.
- A caller with no grant at the root and no header or claim: refused `scope_unresolved`, never widened to the root.

## Requirements

- **FR-001**: The package SHALL be `@stackra/scope` at `packages/security/scope`, `tier:lib`, entries `.`,
  `./contracts`, `./node` and `./react` only.
- **FR-002**: `ScopeConfig` with its shipped `ScopeConfig$` SHALL declare the levels in order, the root's path and the
  aliases as data, with defaults `platform` then `product` and no level another package contributes.
- **FR-003**: `ScopeTree`, `ScopeResolver` and `GrantedScopes` SHALL be abstract classes in `src/contracts/` that extend
  `Port` and work as constructor tokens; `ScopeRef` SHALL be imported from `@stackra/contracts` and not re-exported.
- **FR-004**: `ChainScopeResolverDriver` SHALL ask the header, the claim and the root steps in that order, accept a
  header only when it is a scope path within a grant, and refuse `scope_unresolved` when no step answers.
- **FR-005**: `ScopeNode` SHALL have the `scp` public id, a text level, a unique GiST-indexed `ltree` path and a name,
  with its table under forced row-level security on `app.scope_paths`; `ScopeNodeService.add` SHALL accept only a level
  `childLevelsOf` allows and a valid label.
- **FR-006**: `ScopeDepthEntitlement` SHALL be declared as a plan right with no gated call and no plan values.
- **FR-007**: `useScope()` SHALL read `ActiveScopeService` and re-render on a change, with `null` on the server.
- **FR-008**: No identifier, comment or default in the package SHALL carry tenant vocabulary.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it; the typecheck
  waits for the integrator's install (a new package).

## Open items (for the owner, not blocking)

- ADR 0327 d6: the current scope on the action context and the audited switch need a `scope` field on
  `@stackra/actions`' `CallOptions`, `CallDescriptor` and `ExtensionContext`, which have none and no extension point.
- `EntitlementKind` has no numeric right without a counted model, so `ScopeDepthEntitlement` is a limit naming
  `ScopeNode`; the depth check at node creation (ADR 0240) waits for that decision.
- `t.scopePath()` names its GiST index `idx_<table>_scope_path`, the name `t.unique(["scope_path"])` would take, so the
  unique index is a raw statement until @stackra/database names the two apart.
- ADR 0327 d10 names a scope switcher in `./react`; it is not built (`ActiveScopeService.set` is its logic). No `./native`
  entry: `useScope` serves both runtimes.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)

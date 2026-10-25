# Feature Specification: `@stackra/iam` wave 6, permissions, policies, roles and the decision point

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/iam` (security, wave 6) for real: the `Permissions`, `Permission`, `Policy<M>` and
`Role({ grants })` kinds the template's `access/` files extend, `Decision`, `Risk` and `SystemRole`, the embedded
policy decision point (`check()`), the action pipeline's `AccessControl` driver, `usePermission` and the `actors` test
helpers; ship `Risk` so `@stackra/clients` stops typing `risk` as text.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's commerce and notifications services consume it once converted, STA-344)
- **Packages touched**: `packages/security/iam` (new member); `packages/application/clients` (three `risk` types and
  one dependency)
- **Cross-service events**: none here; the IAM service pushes snapshots that a `PolicySource` driver reads
- **Tenancy and data**: none stored; grants name scope nodes through the contracts `ScopeRef` (R-59, ADR 0327)
- **Secrets**: none
- **ADR needed**: no (ADR 0208, 0132, 0333, 0294, 0305 and 0331 settle the shape); one reading of 0331 d11 is recorded
  under open items
- **New dependencies**: none outside the workspace; runtime edges to `@stackra/actions`, `@stackra/container`,
  `@stackra/contracts`, `@stackra/errors`, `@stackra/rules` and `@stackra/scope`, and (STA-595, `./node` only)
  `@stackra/database`, `@stackra/model` and `@stackra/validation`; dev dependencies from existing catalogs
- **Deploy modes**: same code in all; only the bound `PolicySource` driver differs
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/security/iam/README.md`, `packages/security/iam/AGENTS.md`; ADR 0208, 0132, 0333,
  0099 and 0331 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public contract the pipeline, gen and every authorised call use)

## Clarifications

### Session 2026-10-25

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR
0294, 0305). The choices recorded when it was specified:

- ADR 0132 as amended by 0294: a permission is a `static readonly <verb> = Permission.Lx` on `<Model>Permissions`; a
  policy extends `Policy<Model>` and its methods are named after verbs; any deny wins
- ADR 0208 (with the 0327 and 0333 notes): grants inherit downward on the scope tree `@stackra/scope` owns; deny
  overrides allow; delegation stays at or below a held role's node; visibility rules are conditions the decision point
  evaluates
- ADR 0333 decision 7: a record no visibility rule matches gets no default; the decision point answers `Abstain`
- ADR 0331 decision 11: IAM reuses the rules operator set; the decision point evaluates conditions in process from the
  snapshot with `@stackra/rules`' `evaluate` rather than a second evaluator
- R-59: no tenant vocabulary; the audience is a `ScopeRef`, a segment ref or a role ref, and the segment ref is
  declared here until `@stackra/segments` (wave 7) ships its own
- Owner mode 2026-10-24: write code and tests, run lint, format, the validator and the spec gate only

### Session 2026-10-25 (STA-595, record visibility in reads)

- ADR 0333 decisions 1 and 4: a model declares visibility with `@stackra/model`'s `@Visibility` facet; this package
  binds `@stackra/database`'s `VisibilityFilter` port (STA-487) in a new server-only `./node` entry, so `.` stays
  isomorphic
- ADR 0333 decision 3 and ADR 0208 decision 3: `visibleCondition` settles each rule's audience for the principal and
  joins the matching rules' conditions by the deny rule; ADR 0331 decision 11 (IAM keeps its own evaluation path): the
  driver translates that condition into the read's filter with `evaluate`'s semantics instead of evaluating rows
- ADR 0333 decision 7 stays open: no record type ships a default; the `registerVisibility` row states `unmatched`
  (required, no default in code), and `visibility` still answers `Abstain`
- ADR 0333 amendment: a rule follows relations (`follows`), and the filter bounds counts and aggregates (the seam
  already ANDs it into them); existence-only results and the break-glass read log are the read path's, not built here
- ADR 0333 decision 5 and ADR 0327: the filter only narrows, carries no scope isolation and has no bypass

## User Scenarios & Testing

### User Story 1 - Declare permissions, policies and roles (Priority: P1)

A module author writes `class OrderPermissions extends Permissions { static readonly cancel = Permission.L2 }`,
`class OrderPolicy extends Policy<Order>` with a `cancel(actor, order)` method, and `class OrderClerkRole extends
Role({ grants: [...] }) {}`.

**Independent Test**: `src/core/bases/__tests__/*.test.ts`, `src/core/values/__tests__/permission.value.test.ts`.

**Acceptance Scenarios**:

1. **Given** a role granting a system permission, **When** the class is declared, **Then** it throws a `TypeError`.
2. **Given** the called policy form without its model type argument, **When** it is type-checked, **Then** it fails.

### User Story 2 - Refuse a call the caller may not make (Priority: P1)

The pipeline's permission step refuses a call whose actor holds no applicable grant, and `ctx.authorize(record)`
refuses when the record's policy denies or a deny rule matches the record.

**Independent Test**: `src/core/drivers/__tests__/iam-access-control.driver.test.ts`,
`src/core/services/__tests__/policy-decision-point.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** a manager grant at a node, **When** a call acts at a child node, **Then** it is allowed; beside it, refused.
2. **Given** a grant and a deny for the same permission, **When** the call runs, **Then** it refuses `forbidden`.
3. **Given** a customer and another customer's order, **When** cancel runs, **Then** the policy denies it.

### User Story 3 - Show only what the session may do (Priority: P2)

A navigation calls `const can = usePermission()` and renders a tab only when `can(OrderPermissions.read)`.

**Independent Test**: `src/react/permission/__tests__/use-permission.test.tsx`.

### User Story 4 - Test as a caller (Priority: P1)

A test runs `run(CancelOrderAction, input, { as: actors.customer(order.customerId) })`; the testing plugin opens the
memory policy so the module's policy decides.

**Independent Test**: `src/testing/constants/__tests__/*.test.ts`.

### User Story 5 - Read only the records the caller may see (Priority: P1)

A model declares `@Visibility({ attributes: ["collection"] })`, gen registers it with `registerVisibility`, and a
customer's `CrudService` list, single read and count of it return only the rows the visibility rules in force for that
customer let it see; a document that follows its matter is visible only when its matter is.

**Independent Test**: `src/core/services/__tests__/policy-decision-point.service.test.ts` (`visibleCondition`),
`src/node/**/__tests__/*.test.ts`.

**Acceptance Scenarios**:

1. **Given** a segment allow rule with a condition, **When** a member reads, **Then** the filter is that condition.
2. **Given** a deny rule and an allow rule that both match, **When** the principal reads, **Then** the deny wins.
3. **Given** `unmatched: Deny` and no rule for the principal, **When** it reads, **Then** it sees no row.
4. **Given** a model with `@Visibility` and no registration, **When** anyone reads it, **Then** the read fails.

### Edge Cases

- A call with no permission (an `auth: false` query): passes the step.
- A call with no scope: only grants held at a root node apply.
- A wildcard in a custom role: ignored; only a system role may hold one.
- A system permission: held by system and job actors and a service acting for no one; never through a role.
- A service acting for a user: both must hold the permission.
- A conditional deny on a model with no fact source: denies (fail closed).
- An unknown scope node, an unconnected policy or a policy answer that is not a `Decision`: refuses or errors.
- A read with no principal (a listener, a job runner, a seeder): the platform; row-level security still bounds it.
- A stored visibility condition naming an attribute the model does not register: the read fails
  (`ConditionInvalidError`); a model that registers no attributes reads a conditional allow as matching nothing and
  a conditional deny as matching everything.
- A null attribute: matches `is_not_set` only, under `not` as well, as in `evaluate`.

## Requirements

- **FR-001**: The package SHALL be `@stackra/iam` at `packages/security/iam`, `tier:lib`, entries `.`, `./contracts`,
  `./node` (server only, STA-595), `./react` and `./testing`.
- **FR-002**: `.` SHALL export every value the template imports from `@stackra/iam` (`Decision`, `Permission`,
  `Permissions`, `Policy`, `Risk`, `SystemRole`), `./react` `usePermission` and `./testing` `actors`.
- **FR-003**: `Permissions` SHALL be a bare kind, `Policy` a kind with a bare and a called form typed by its model,
  and `Role` a called kind that refuses an empty grant list, a non-`Permission` grant and a system permission.
- **FR-004**: `PolicyDecisionPointService` SHALL decide a permission from the principal's snapshot: downward grant
  inheritance, expiry, root-only grants for a scopeless call, wildcards only in system roles, system permissions for
  the platform only, deny over allow, conditional denies only against a record, and every link of the actor chain.
- **FR-005**: `visibility` SHALL answer `Deny` over `Allow` and `Abstain` when no rule matches; `canDelegate` SHALL
  allow only a held role at or below its node.
- **FR-006**: `IamAccessControlDriver` SHALL implement `AccessControl`: `require` checks the call's permission where
  the call acts and `authorize` runs the policy method named after the verb, then the check with the record; it
  refuses with `ForbiddenError` and fails closed.
- **FR-007**: `registerPermissions`, `registerRoles` and `registerPolicies` SHALL refuse a row that does not match its
  class at boot, and `permissionKey` SHALL refuse an unregistered static.
- **FR-008**: `usePermission` SHALL read `PermissionSnapshotService` through `useSyncExternalStore` and throw without a
  binding; `actors` SHALL build frozen actors with fixed user defaults.
- **FR-009**: `@stackra/clients` SHALL type `risk` as `Risk` from this package.
- **FR-010**: `visibleCondition` SHALL return the condition a record meets exactly when the principal may do the
  capability with it: no matching deny rule's condition holds and, unless `unmatched` is `Allow`, a matching allow
  rule's does; the platform gets every record; each stored condition is checked against the model's `Rules`, and
  without them a conditional allow matches nothing and a conditional deny everything.
- **FR-011**: `./node` SHALL export `IamVisibilityFilterDriver`, a `VisibilityFilter` driver that returns, for the
  `see` capability at the running call's scope node and instant, a MikroORM filter matching exactly the rows
  `evaluate` would match; `{}` for no principal or an undeclared model; an error for a declaring model without a row
  or a cycle of follows; and, for each followed relation, the related model's filter nested under it.
- **FR-012**: `registerVisibility` SHALL refuse at boot a row whose model declares no `@Visibility`, whose key is not a
  model key, whose `unmatched` is not `Allow` or `Deny`, whose rules are not exactly the facet's attributes under
  `record`, that has a geo attribute, or whose followed relation is not a many-to-one to a declaring model.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package, and the validator reports nothing for it.

## Open items (for the owner, not blocking)

- ADR 0331 decision 11 says the decision point keeps its own evaluation path, while decision 1 and the planned lint
  forbid an evaluator outside `@stackra/rules`. This package reads d11 as "evaluates in process from the snapshot" and
  calls `evaluate`; a note on 0331 would settle it.
- The registry row lists `tenancy` as a dependency; since ADR 0327 the scope tree is `@stackra/scope`'s, so IAM depends
  on scope (for `GrantedScopes`, `ScopeTree` and `isWithinScope`) and not on tenancy.
- `SystemRole` holds `owner`, `manager` and `staff` (the template names the first two); more codes need an owner
  decision.
- Settled by the R5 reconciliation: the call descriptor carries `scope` (ADR 0327 decision 6) and the driver reads it;
  only a call without one reads the caller's node from `ScopeTree`.
- The client snapshot is set by the session's owner (`@stackra/identity`), which does not set it yet.
- Not built: the server `PolicySource` driver and the IAM service, separation-of-duties pairs and access reviews
  (paid, ADR 0208 decision 5).
- ADR 0333 decision 7 (owner): what does a record no visibility rule matches look like to an audience? Until decided,
  `registerVisibility` requires `unmatched` (`Allow` or `Deny`) on every row and gen has no source for it.
- The query filter applies `see` only: the `VisibilityFilter` port does not say whether a read is a list (`list`) or a
  single read (`see`). Threading the read kind through `visibleFilter` is a database change.
- `@Visibility` is a class facet ADR 0294 decision 6 does not list; a note on 0294 should add it.
- `whereOf` translates a condition into a filter beside `evaluate`; ADR 0331 decision 11 allows IAM its own path, but
  the planned "no evaluator outside rules" lint must allow it (or rules may host the translation later).
- A context without a scope node is judged at the root (a `shortcut:`), narrower than the permission step's
  credential fallback, until every call carries its scope (ADR 0327 decision 6).
- Existence-only results (a masked placeholder) and the break-glass read log of ADR 0333's amendment: the read path
  (database) and the access log, not built.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec for the wave 6 build (owner mode 2026-10-24: develop now, test later)
- 2026-10-25 · Implementing → Implementing · Claude (package-builder) · STA-595: `visibleCondition`, the `./node` visibility filter driver and `registerVisibility` (ADR 0333 d1-d5; d7 left to the owner)

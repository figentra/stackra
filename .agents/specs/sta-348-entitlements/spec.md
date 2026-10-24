# Feature Specification: `@stackra/entitlements` wave 4, plan rights and the entitlement step

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/entitlements` (security, wave 4) for real: the `Entitlement({ kind, counts })` kind base the
template's `product-limit.entitlement.ts` extends, the ports grants and counts come from, the driver of the action
pipeline's existing entitlement step, the `LimitReachedError` refusal and the `fakeEntitlements` test helper.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's commerce service consumes it once converted, STA-344)
- **Packages touched**: `packages/security/entitlements` (new member)
- **Cross-service events**: none; grants arrive through the `EntitlementSource` port
- **Tenancy and data**: none stored; a grant is keyed by the scope's public id (the contracts `ScopeRef` once it ships, R-59)
- **Secrets**: none
- **ADR needed**: no (ADR 0215, 0138 as amended, 0294 and 0305 settle the shape; the owner decisions of 2026-10-24 bind it)
- **New dependencies**: none outside the workspace; runtime edges to `@stackra/actions`, `@stackra/container`,
  `@stackra/contracts` and `@stackra/errors`; dev dependencies from existing catalogs
- **Deploy modes**: same code in all; the `EntitlementSource` driver differs (plan service in SaaS, licence on-prem and air-gapped)
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/security/entitlements/README.md`, `packages/security/entitlements/AGENTS.md`; ADR 0138, 0178, 0215, 0270, 0294, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public contract the pipeline, gen and every gated call use)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Owner, 2026-10-24 (final review H, R-61): entitlements are options on a kind, never model traits; they gate calls,
  not records
- Owner, 2026-10-24 (R-02): an exhausted limit refuses with the typed `LimitReachedError` (`limit_reached`), a
  `Refusal` with a static `create`, the entitlement refusal MCP tools surface (ADR 0155, 0217)
- Owner, 2026-10-24 (R-59): no tenant vocabulary; a grant is keyed by a scope reference. The contracts `ScopeRef` does
  not exist yet, so the ports take the scope's public id and the plan driver reads it from the call descriptor in one
  marked place
- The package plugs into `EntitlementCheck`, the step `ActionPipeline` already runs after the preconditions (ADR 0138
  as amended); it adds no second mechanism
- `@stackra/licensing` is the on-prem source of grants, and feature flags and consent stay separate packages: sources
  are drivers of `EntitlementSource` bound outside this package

## User Scenarios & Testing

### User Story 1 - Declare a plan right (Priority: P1)

A module author writes `class ProductLimitEntitlement extends Entitlement({ kind: EntitlementKind.Limit, counts: () =>
Product }) {}`; a feature or module entitlement takes no `counts`.

**Independent Test**: `src/core/bases/__tests__/entitlement.base.test.ts`.

**Acceptance Scenarios**:

1. **Given** a limit without `counts`, **When** the class is declared, **Then** it throws a `TypeError`.
2. **Given** a kind outside `EntitlementKind`, **When** the class is declared, **Then** it throws a `RangeError`.

### User Story 2 - Refuse a call the plan does not cover (Priority: P1)

The pipeline's entitlement step refuses a gated call whose right is not in the scope's plan, and the create that would
pass a limit, before `handle` runs.

**Independent Test**: `src/core/drivers/__tests__/plan-entitlement-check.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** a plan of two products and one product, **When** the generated create runs, **Then** it succeeds.
2. **Given** a plan of two products and two products, **When** the generated create runs, **Then** it refuses
   `limit_reached` with the key and the limit.
3. **Given** a feature outside the plan, **When** a call it gates runs, **Then** it refuses `entitlement_required`.

### User Story 3 - Fake the plan in a test (Priority: P1)

A test overrides the source with `fakeEntitlements([[ProductLimitEntitlement, 2]])` and asserts
`toRefuseWith(refusal(LimitReachedError))`.

**Independent Test**: `src/testing/functions/__tests__/fake-entitlements.function.test.ts`.

### User Story 4 - Register what gen derived (Priority: P2)

Gen's entry calls `registerEntitlements` with each entitlement's locked key and the calls it gates; a keyed source
reads the key with `entitlementKey`.

**Independent Test**: `src/core/functions/__tests__/register-entitlements.function.test.ts`,
`src/core/functions/__tests__/entitlement-key.function.test.ts`.

### Edge Cases

- A call no entitlement gates: the source is not asked.
- A limit granted `Number.POSITIVE_INFINITY`: nothing is counted.
- A grant of the wrong shape (a count for a feature, `true` for a limit): a `TypeError`, never an allowed call.
- An unregistered entitlement class: `entitlementKey` throws rather than guessing a key.
- Two creates racing at the limit may both pass: the check reads a snapshot; a hard bound needs a storage constraint.

## Requirements

- **FR-001**: The package SHALL be `@stackra/entitlements` at `packages/security/entitlements`, `tier:lib`, entries
  `.` and `./testing` only.
- **FR-002**: `.` SHALL export every value the template imports from `@stackra/entitlements` (`Entitlement`,
  `EntitlementKind`, `EntitlementSource`, `LimitReachedError`) and `./testing` SHALL export `fakeEntitlements`.
- **FR-003**: `Entitlement` SHALL be a called-only kind base that records `kind` and, for a limit only, `counts`, and
  refuses any other combination at declaration.
- **FR-004**: `EntitlementSource` and `EntitlementUsage` SHALL be abstract classes that extend `Port` and work as
  constructor tokens; a grant SHALL be keyed by the entitlement class and the scope, never by a tenant.
- **FR-005**: `PlanEntitlementCheckDriver` SHALL be a driver of `EntitlementCheck` from `@stackra/actions/contracts`
  that refuses `entitlement_required` for a right outside the plan and `limit_reached` when a limit's count already
  equals or passes its grant.
- **FR-006**: `LimitReachedError` SHALL be a `Refusal` of kind `EntitlementRequired`, not retryable, whose typed
  `create` takes the entitlement key and the limit.
- **FR-007**: `registerEntitlements` SHALL refuse a row whose class is not an entitlement, whose key is empty or whose
  gate is not an action or a query.
- **FR-008**: `fakeEntitlements` SHALL return an `EntitlementSource` that answers each listed grant in every scope and
  `undefined` for any other entitlement.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package, and its typecheck passes.

## Open items (for the owner, not blocking)

- The contracts `ScopeRef` (R-59) does not exist; the ports take `PublicId | undefined` and the driver reads the call
  descriptor's tenant id in one marked place until it ships.
- R-61 names an `entitlement:` option on actions, routes and resources. `Action({...})` and `Query({...})` have no such
  option yet (an `@stackra/actions` change); until then gen's `registerEntitlements` rows carry the gates.
- ADR 0215 decision 3 names the code `limit_exceeded`; the owner's `LimitReachedError` (`limit_reached`) wins and the
  ADR needs a note. Its hard, soft and grace policies (decision 4) are not built: every limit is hard.
- No `EntitlementSource` driver ships here: the SaaS driver belongs to the plan service, and the on-prem one needs a
  verified-licence token from `@stackra/licensing`, which has none yet.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)

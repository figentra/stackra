# Feature Specification: `@stackra/panel` wave 8, resources, widgets, documents and panels

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/panel` (experience, wave 8): the `Resource<M, R?>`, `Widget<Q>`, `Document({ kind })` and
`Panel` kinds, the pure resource and widget builders gen records, the metric shapes and the time range input with their
shipped schemas, typed slots and placement layers (with ADR 0336's layer 2b), the data constructors gen writes into
`#stackra/resources`, `#stackra/panels` and `#stackra/slots`, the web dashboard, shell, breadcrumbs and action runner,
and the native widget slot (ADR 0307, 0164, 0306, 0305). The old `./schemas` entry folds into `.`.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's apps, services and loyalty kit adopt it once converted, STA-344)
- **Packages touched**: `packages/experience/panel` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none; the package stores nothing and no tenant vocabulary is used (layer 4 is a scope node's
  copy, R-59)
- **Secrets**: none
- **ADR needed**: no (ADR 0307, 0164, 0306, 0336 and 0294 decide the package); one naming choice is recorded below
- **New dependencies**: none outside the workspace and the catalogs; runtime edges to actions, clients, container,
  contracts, errors, experience, i18n, iam, icons, money, navigation (R4: the breadcrumb trail and the route pages),
  query, ui and validation; React Router (catalogued) joins as an optional peer
- **Deploy modes**: same code in all; no I/O beyond the client calls the host's transport makes
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/experience/panel/README.md`, `packages/experience/panel/AGENTS.md`; ADR 0307, 0164, 0306 and 0336 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public kinds every module's admin surface declares)

## Clarifications

### Session 2026-10-25

The package follows ADR 0307, the v3.1 registry row, the owner decisions of 2026-10-24 and the programming model v3
and v3.1 (ADR 0294, 0305). The choices recorded when it was specified:

- Naming (no owner ruling found in the registry's owner answers or decisions): the row's `Step` and `Field` collide
  with a workflow step and `@stackra/validation`'s `Field` decorator (ADR 0294 decision 23), so the form constructors
  are named for their kind, `FormStep` and `FormField`. The builder methods inside `form(f)` keep the template's names
  (`x.step`, `x.steps`, `x.from`)
- `./schemas` is folded into `.` (registry Q4, note A3): `CountMetric$`, `MoneyMetric$` and `TimeRangeInput$` are
  exported once, from `.`
- A create placement records the page it opens as `after` (the builder method stays `.then(page)`), so no recorded node
  is a thenable-looking object
- Builders are interfaces in `src/core/types/` with an internal record class each; every node is built by the data
  constructor gen also writes, so authored and generated trees hold the same nodes
- `describeResource` and `describeWidget` run the members on an object with the class's prototype, so no constructor
  and no dependency runs while gen records them
- Placements carry a `PlacementLayer` (1, 2, 2b, 3, 4, 5); `resolvePlacements` keeps each item's highest layer and never
  merges (ADR 0306 rules 7 and 8, ADR 0336 decision 4)
- Widget roles are `@stackra/iam`'s `SystemRole`; block props are `@stackra/experience`'s `BlockProps`
- The action runner sends through a `ServiceClient` subclass over the container's `ClientTransport`, because
  `@stackra/clients` keeps its offline-aware run internal

## User Scenarios & Testing

### User Story 1 - Declare a resource (Priority: P1)

A module writes `class OrderResource extends Resource<Order, OrderView>({ area, navigation, operations })` with
`override` members `table`, `views`, `form`, `infolist`, `relations` and `actions`.

**Independent Test**: `src/core/bases/__tests__/resource.base.test.ts`, `src/core/functions/__tests__/describe-resource.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a resource class, **When** gen records it, **Then** each overridden member's tree is recorded and the
   others are absent.
2. **Given** an unknown area or operation, **When** the class is declared, **Then** it is refused at import.

### User Story 2 - Declare a widget and place it (Priority: P1)

A module writes `class OrderKpisWidget extends Widget<OrderKpisQuery>({ slot, ranges, range })` with a `display(d)`; a
host moves a package's widget with `Widget.place(Base, { slot, order })`.

**Independent Test**: `src/core/bases/__tests__/widget.base.test.ts`, `src/core/functions/__tests__/resolve-placements.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a widget, **When** gen records it, **Then** its display tree and its layer-1 options are recorded.
2. **Given** a placement, **When** it changes the query, **Then** it is refused; **When** it moves the slot, **Then** it
   is recorded in layer 2 (or 2b or 3) and keeps the base's display.

### User Story 3 - Report metrics from a query (Priority: P1)

A query returns `OrderKpisOutput.create({ revenue: MoneyMetric.from(sum, { currency, series, target }) })` for a
`TimeRangeInput`.

**Independent Test**: `src/core/schemas/__tests__/money-metric.schema.test.ts`, `src/core/schemas/__tests__/time-range-input.schema.test.ts`.

### User Story 4 - Render a dashboard and run actions (Priority: P2)

The console renders `<PanelShell panel={Panels.Admin}>` and `<Dashboard panel slots={[Slots.Dashboard.Main]} />`;
the palette runs an intent with `useActionRunner()`; the mobile home renders `<WidgetSlot slot columns={2} />`.

**Independent Test**: `src/react/dashboard/__tests__/dashboard.test.tsx`, `src/react/action-runner/__tests__/use-action-runner.test.tsx`, `src/native/widget-slot/__tests__/widget-slot.test.tsx`.

### Edge Cases

- A widget whose display the slot's place does not take (a list in a Band): not drawn there.
- A higher layer's placement with `slot: null`: the item leaves every slot.
- An L2 to L4 action without declared confirmation text: a generic confirmation is still asked.
- A refusal from a run: resolved as refused after a danger toast, never an unhandled rejection.
- A custom range without a start, or an end before the start: refused by `TimeRangeInput$`.

## Requirements

- **FR-001**: The package SHALL be `@stackra/panel` at `packages/experience/panel`, `tier:lib`, entries `.`, `./react`
  and `./native` only.
- **FR-002**: `Resource<M, R?>({ area, navigation, operations })` SHALL be a called-only partner kind whose optional
  members return builders recorded by `describeResource`; a missing type argument SHALL fail to compile.
- **FR-003**: `Widget<Q>({ ... })` SHALL be a called-only partner kind with an abstract `display(d)`, refusing a bad
  size, order, range or a refresh under 30 seconds; `Widget.place` SHALL change only slot, order, size and params.
- **FR-004**: `Document({ kind })` SHALL refuse a non-widget block or a layout on a Dashboard and a range on a Page;
  `Panel({ path, area })` SHALL refuse a relative path and an unknown area.
- **FR-005**: `CountMetric`, `MoneyMetric` and `TimeRangeInput` SHALL be shape classes registered with their shipped
  schemas, exported as `CountMetric$`, `MoneyMetric$` and `TimeRangeInput$` from `.` only.
- **FR-006**: The data constructors and `slots`, `panels`, `resource`, `document`, `widget` SHALL return frozen data with
  derived keys, and refuse malformed keys and paths.
- **FR-007**: `resolvePlacements` SHALL keep each item's highest-layer placements, ranking 1 < 2 < 2b < 3 < 4 < 5.
- **FR-008**: `Dashboard` and `WidgetSlot` SHALL render the registered widgets of their slots that the session may read,
  each running its query with its params and range and refreshing on its events and interval.
- **FR-009**: `useActionRunner` SHALL ask the declared confirmation (or a generic one for L2 to L4), send the action,
  refresh cached queries and toast the success text or the refusal.
- **FR-010**: `PanelShell` and `usePanel` SHALL share the panel, and the shell SHALL hold navigation's breadcrumb trail
  (`BreadcrumbsProvider`), whose `useBreadcrumbs` `./react` re-exports for the template; panel keeps no crumb store.
- **FR-012**: `registerPanelPages()` SHALL register with navigation's `registerRoutePages` the `panel` page `toPanel`
  renders (the shell of the panel the class declares) and return the disposer; the `resource` page is not registered
  until the generic pages exist.
- **FR-011**: No identifier, comment or default SHALL carry tenant vocabulary, and the form constructors SHALL be
  `FormField` and `FormStep`.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it; the typecheck
  waits for the integrator's install (a new package).

## Open items (for the owner, not blocking)

- Template symbols `Step` and `Field` (the generated `resources.ts` sample) are `FormStep` and `FormField` here; gen
  writes the new names and the sample converts in STA-344. The sample's `Placement.create({ then })` is `{ after }`.
- The generic resource pages (List, View, Create, Edit, relation managers), the built-in View as JSON, clone and
  activity tab (ADR 0334 rules 9 to 11), and the View display that renders a resource's view, wait for the resource
  table renderer; when they exist, `registerPanelPages` registers them as navigation's `resource` page (its page names
  are panel's `ResourcePage` codes: `list`, `view`, `create`, `edit`) and the panel page frames them.
- The queued export and import pipelines and the `ImportMapper` port (ADR 0307 rule 10, 0334 rule 11) need a `./node`
  entry over queue and media; only their placements are built.
- `@stackra/actions`' `periodOf` reads `today`, `last_7_days`, `last_30_days` and `this_month`; `TimeRange.Yesterday` and
  `TimeRange.Custom` refuse there until it adds those two cases.
- The Chart, Table, Timeline, Banner and Check displays and the `NumberMetric`, `PercentMetric` and `DurationMetric`
  shapes wait for their options and units to be decided.
- Layers 4 and 5 (a scope node's layout copy and the user's overlay) are accepted by `resolvePlacements` but no layout
  is read yet: `Dashboard`'s `overridable` waits for the experience service's layout query.
- The action runner does not queue a run offline (`@stackra/clients` keeps its offline-aware run internal), and KPI
  drill-down links and sparklines are not drawn yet.

## Reconciliation 2026-10-25 (R4)

- The crumb store, `useBreadcrumb` and `useBreadcrumbs` moved to `@stackra/navigation/react` (with
  `BreadcrumbsProvider`): navigation's route adapters are the natural publisher and panel depends on navigation, never
  the reverse. `./react` keeps `useBreadcrumbs` as a re-export (the template's console shell imports it from here);
  `useBreadcrumb` and `Breadcrumb` leave panel's surface (the template imports neither from panel).
- `registerPanelPages()` registers the `panel` page; the panel key is derived from the class name until gen's panel
  table is registered (STA-339).

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)

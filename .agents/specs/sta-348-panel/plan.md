# Plan: `@stackra/panel` wave 8

**Spec**: `.agents/specs/sta-348-panel/spec.md`

## Design

- Three entries through stand-in barrels (STA-339 replaces them): `.` from `src/core/`, `./react` from `src/react/`,
  `./native` from `src/native/`. No `./contracts`: the package has no port; no `./node`: the export and import pipelines
  are not built.
- `Resource`, `Widget`, `Document` and `Panel` are `createKind` bases. `Resource` and `Widget` take their partner as a
  type argument through `WithPartner`; `ResourceBase` declares one optional member per builder, `WidgetBase` an abstract
  `display`. `Widget.place` registers a subclass of the base under the `widget` kind with the base's options, the
  placement and its layer.
- Builders: public interfaces in `src/core/types/`; internal records in `src/core/records/` that collect flags on a
  `DraftRecord` and build each node with the data constructor in `src/core/constants/` (`Column`, `Filter`, `View`,
  `Entry`, `Section`, `Relation`, `Placement`, `FormField`, `FormStep`, `WidgetDisplay`, `Blocks`, `Bind`, `Drill`,
  `DateRange`).
- `describeResource` and `describeWidget` call each member on `Object.create(Class.prototype)` with a fresh record.
- `CountMetric`, `MoneyMetric` and `TimeRangeInput` are `Schema` classes with shipped zod schemas registered at load.
- `slots`, `panels`, `resource`, `document` and `widget` build the frozen data gen writes; `registerWidgets` fills an
  internal table; `widgetsFor` resolves the layers and filters by slot and place.
- Web: `PanelShell` provides a context (panel, breadcrumb map) and the ui `ConfirmationProvider`; `Dashboard` lays out
  `WidgetTile`s (one card per widget over `useQuery`, a range picker, `refreshOn` through `ServerStateCache.watch`,
  `refreshEvery` through an interval) and gates by `ClientSession.can`; `useActionRunner` confirms, sends through an
  `ActionRunnerClient` (a `ServiceClient`), invalidates the cache and toasts.
- Native: `WidgetSlot` lays out `WidgetCard`s on `@stackra/ui/native`, `columns` to a row.

## Constitution Check

| Law                                   | Result | Note                                                                                                                   |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/experience/panel`; imports only `tier:lib` packages; no app, service or `encore.dev`           |
| Secrets (ADR 0173)                    | PASS   | no secret is read or stored                                                                                            |
| Security                              | PASS   | buttons and tiles hide by the session's permissions only; every run and query is still decided on the server           |
| HTTP and events                       | N/A    | no endpoint or event here; gen writes the resource operations                                                          |
| Tenancy                               | PASS   | no tenant vocabulary (R-59); layer 4 is a scope node's copy                                                            |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology; documents reference registered code only (ADR 0154)                                |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                              |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                      |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                              |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                     |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0307 stands, the open items are listed in the spec                       |

- Boundaries: runtime imports of actions, clients, container, contracts, errors, experience, i18n, iam, icons, money,
  query, ui and validation; dev-only `@stackra/testing`, the tooling presets and the React test libraries.
- Versions: catalogs and `workspace:*` only.
- Naming: kind bases without `define`, records `<Name>Record`, the form constructors `FormField` and `FormStep`.

## Properties

- **P-001**: `package.json` names `@stackra/panel` at `packages/experience/panel` and `exports` lists only `.`, `./react` and `./native` — Validates: FR-001
- **P-002**: for every resource class, `describeResource` holds exactly the nodes of its overridden members, and an unknown area or operation refuses at declaration — Validates: FR-002
- **P-003**: for every widget class, `kindOf` records layer 1, a placement records its layer and base and keeps the base's display, and a placement key outside slot, order, size, params and layer refuses — Validates: FR-003
- **P-004**: a Dashboard with a non-widget block or a layout, a Page with a range, and a panel with a relative path each refuse — Validates: FR-004
- **P-005**: `schemaOf(X)` is `X$` for each shape, and `X$` is exported from `.` only — Validates: FR-005
- **P-006**: every constructor returns a frozen node, and `slots` derives `<group>.<name>` snake_case keys — Validates: FR-006
- **P-007**: for every placement list, `resolvePlacements` keeps exactly the placements whose layer rank is the item's maximum — Validates: FR-007
- **P-008**: the rendered tiles are the registered widgets of the slots whose display the place takes and whose permission the session holds — Validates: FR-008
- **P-009**: a declined confirmation sends nothing; a confirmed run resolves done; a refusal resolves refused after a toast — Validates: FR-009
- **P-010**: `useBreadcrumbs` lists one crumb per href ordered by path depth, and a crumb leaves with its publisher — Validates: FR-010
- **P-011**: `grep -ri tenant packages/experience/panel/src` finds nothing, and no export is named `Field` or `Step` — Validates: FR-011

## Deploy modes

| Mode       | Behaviour                                                                     |
| ---------- | ----------------------------------------------------------------------------- |
| SaaS       | the same build; the host's client transport reaches the producers             |
| On-prem    | identical: the same build, no SaaS-only code path                             |
| Air-gapped | identical: needs no network of its own; calls go through the host's transport |

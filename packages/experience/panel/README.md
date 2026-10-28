# @stackra/panel

<!--
Stackra file contract:
Purpose: the package's reader guide: the panel kinds, builders, slots (widget places and shell slots), placement
         layers and renderers, the generic resource pages among them.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0164; ADR 0307; ADR 0306; ADR 0336; ADR 0350; ADR 0438 (shell slots, stackra-03).
-->

Stackra's panel: the admin and portal surfaces modules declare and one renderer draws (ADR 0164, ADR 0307). A module
declares a `Resource` (one model's List, View, Create and Edit pages in one area), a `Widget` (a query bound to a
display), a `Document` (a saved Page or Dashboard of registered blocks, its kind
`ExperienceKind.Page` or `ExperienceKind.Dashboard` of `@stackra/experience/contracts`; its blocks are `PanelBlockNode`s) and an app declares its `Panel`s. Builders are
pure: gen runs each member once and records the tree in the manifest. The query computes every number; the panel only
presents it.

**Tier:** `tier:lib` (`packages/experience/panel`). Entries `.`, `./react` and `./native` (the old `./schemas` is folded
into `.`). Depends on `@stackra/actions`, `@stackra/clients`, `@stackra/container`, `@stackra/contracts`,
`@stackra/errors`, `@stackra/experience`, `@stackra/i18n`, `@stackra/iam`, `@stackra/icons`, `@stackra/money`,
`@stackra/navigation` (the breadcrumb trail and the route pages), `@stackra/query`, `@stackra/support` (`snakeCase`), `@stackra/ui`,
`@stackra/validation` and zod. React, React Router and React Native are optional peers.

## What is here

| Entry      | Symbol                                                                                                                                                                          | Use                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `.`        | `Resource<M, R?>`, `Widget<Q>` (`Widget.place`), `Document`, `Panel`                                                                                                            | the four kinds                                                 |
| `.`        | `Table`, `Views`, `Form`, `Infolist`, `Relations`, `Actions`, `Display`, `CreateInput` (t)                                                                                      | what the builder members receive                               |
| `.`        | `CountMetric`, `MoneyMetric`, `TimeRangeInput` and `CountMetric$`, `MoneyMetric$`, `TimeRangeInput$`                                                                            | metric output shapes and the period input, with their schemas  |
| `.`        | `ActionPlace`, `Count`, `DisplayKind`, `DocumentLayout`, `ExportFormat`, `FilterComparison`, `ImportMode`, `Place`, `PlacementLayer`, `ResourcePage`, `TimeRange`, `WidgetSize` | enums                                                          |
| `.`        | `Bind`, `Drill`, `DateRange`, `Blocks`                                                                                                                                          | binds, drill-downs, date filter values, document blocks        |
| `.`        | `Column`, `Filter`, `View`, `Entry`, `Section`, `Relation`, `Placement`, `FormField`, `FormStep`, `WidgetDisplay`                                                               | the data constructors gen writes into `#stackra/resources`     |
| `.`        | `slots`, `panels`, `resource`, `document`, `widget`, `registerWidgets`                                                                                                          | what gen calls in `#stackra/slots`, `panels`, `resources`      |
| `.`        | `registerResources`                                                                                                                                                             | hands the generated resource trees to the resource pages       |
| `.`        | `defineSlot`, `fillSlot`, `Slot` (t), `SlotFill` (t), `SlotOptions` (t), `SlotCardinality` (t), `SlotComponent` (t)                                                             | shell slots a product fills (ADR 0438)                         |
| `.`        | `describeResource`, `describeWidget`, `resolvePlacements`                                                                                                                       | what gen records; the placement layer rule                     |
| `.`        | `SavedView` (`SavedView$`), `ViewStore` (t), `groupRows`, `ViewGroup` (t), `Aggregate`, `ViewSharing`                                                                           | saved views with grouping, sub-grouping, totals and sharing    |
| `.`        | `fieldsForMode`                                                                                                                                                                 | the form fields a display mode shows                           |
| `.`        | `lineEditorOf`, `LineEditorPlacement` (t), `activeContributions`                                                                                                                | the one line editor of a `LineEntry` slot; inert contributions |
| `./react`  | `PanelShell`, `usePanel`, `useBreadcrumbs`                                                                                                                                      | the panel frame and its trail (navigation's, re-exported)      |
| `./react`  | `registerPanelPages`                                                                                                                                                            | gives navigation the pages `toPanel` and `toResource` render   |
| `./react`  | `ResourceListPage`, `ResourceViewPage`, `ResourceFormPage`, `RelationManager`                                                                                                   | the generic List, View, Create and Edit pages and relations    |
| `./react`  | `Dashboard`, `WidgetTile`                                                                                                                                                       | the widget grid of a panel's slots, one widget as a card       |
| `./react`  | `useActionRunner`, `ActionRunStatus`                                                                                                                                            | run any action through its declared confirmation               |
| `./native` | `WidgetSlot`                                                                                                                                                                    | a slot's widgets on mobile                                     |

## Declaring a resource

```ts
export class OrderResource extends Resource<Order, OrderView>({
  area: ApiArea.Admin,
  navigation: {
    group: I18n.orders.nav.sales,
    icon: "receipt",
    order: 20,
    badge: "awaiting_payment",
  },
  operations: { list: ListOrdersQuery, get: GetOrderQuery },
}) {
  override table(t: Table<OrderView>) {
    return t
      .columns((c) => [
        c.from("id").copyable(),
        c.money("totals.totalMinor", { currency: "totals.currency" }),
      ])
      .filters((f) => [
        f.from("status").pinned(),
        f.dateRange("createdAt").default(TimeRange.Last30Days),
        f.compare("totals.totalMinor", FilterComparison.Gte),
      ])
      .defaultSort("status", SortDirection.Asc)
      .thenSort("createdAt", SortDirection.Desc);
  }

  override actions(a: Actions<OrderView, OrderView>) {
    return [
      a.run(CancelOrderAction).bulk(),
      a.export({ formats: [ExportFormat.Csv, ExportFormat.Xlsx] }),
    ];
  }
}
```

- `M` is the model; `R`, the list row, defaults to `M`. Table, view and infolist keys are dotted paths of the row; form
  keys are paths of the create input. Pages follow from `operations`.
- Every button runs an Action; its places follow its input unless `.in(...)` narrows them; `.bulk()` adds the bulk bar.
- Labels are derived (`<module>::resources.<model>.<part>.<name>`); no name takes a label option.

## Declaring a widget

```ts
export class OrderKpisWidget extends Widget<OrderKpisQuery>({
  slot: Slots.Dashboard.Header,
  ranges: [TimeRange.Today, TimeRange.Last7Days],
  range: TimeRange.Today,
}) {
  display(d: Display<OrderKpisOutput>) {
    return d.kpiGroup([d.kpi("revenue").icon("banknote"), d.kpi("orders").icon("receipt")]);
  }
}
```

- A KPI binds to an output field typed `MoneyMetric` or `CountMetric`; format, currency, trend and target come from the
  type. The query builds them with `MoneyMetric.from(sum, { currency, series, target })`.
- `refreshOn` is derived from the query's `cache.invalidateOn`; write it only for an uncached query. `refreshEvery` is at
  least 30 seconds.
- `Widget.place(Base, { slot, order, size, params })` moves a widget it does not own. Placements replace one another by
  layer: owner (1), host (2), edition (2b), app (3), a scope's copy (4), the user's overlay (5); `resolvePlacements`
  keeps each item's highest layer.

## Saved views

A saved view (ADR 0359 decision 14, reopening rule 13) is a person's filter, sort and columns for a resource, plus a
grouping (`group: { by, then? }`), totals per group (`count`, `sum`, `average`, `min`, `max` of a row path) and its
sharing (`private`, or everyone in the owner's `scope` who may read the resource). It stores declared keys only, and
the list query still gates every row. The host binds a `ViewStore` driver (`list`, `save`, `remove`); `groupRows(rows,
view)` groups what is on screen in first-met order, so the view's sort holds. A list that pages or that the server
totals sends its own totals.

## Display modes

`fieldsForMode(fields, mode)` shows every form element in developer mode and only the essential ones in normal mode
(`FormField.from(key, { essential: true })`, or `.essential()` in a `form(f)` member); a repeater, grid or step stays
when a field inside it is essential. A mode is display only (ADR 0359 decision 2): a hidden field keeps its value, and
nothing about what the viewer may do changes. The switch is `@stackra/ui`'s `ModeSwitch`.

## Shell slots (ADR 0438)

A shell (the OS console, ops, landing or mobile app) is built and deployed once, so a product changes it through
slots, never by shadowing its files. The shell package declares each slot with its props type, and a product's UI
package fills it with a component of that type:

```ts
export const SignInBrandPanel = defineSlot<BrandPanelProps>({
  key: "auth.sign_in.brand_panel",
  surface: "console",
});
export const MezzoraBrandPanel = fillSlot(SignInBrandPanel, BrandPanel, { surface: "console" });
```

`cardinality` is `one` (default: the fill replaces the shell's default) or `many`. TypeScript checks the component's
props; gen lists both in the manifest (`slots`, `fills`) for the OS registry and refuses a fill of an undeclared slot,
on another surface or built against other props than the shell's committed manifest. A fill changes presentation
only. `Slot` is a shell place; `SlotRef` (`slots({...})`) stays a widget place inside a panel.

## Edition slots

A document with lines declares one `LineEntry` slot (`Place.LineEntry`, ADR 0350 decision 6). `lineEditorOf(slot,
placements)` gives the one editor it shows, the highest layer's, so an edition's editor at layer 2b replaces the base's
and never sits beside it; two at one layer throw. `activeContributions(items, installed)` keeps a contribution to an
enhanced module inert until that module is installed (ADR 0350 decision 4).

## Forms: `FormField` and `FormStep`

The form's element and step constructors are named for their kind: a bare `Field` is `@stackra/validation`'s field
decorator and a bare `Step` is a workflow step (ADR 0294 decision 23, one meaning per word). Inside a `form(f)` member
the builder methods stay `x.from`, `x.grid`, `x.steps`, `x.step`, `x.upload` and `x.repeater`.

## Rendering

- `registerWidgets(widgets)` hands a member's generated widget table to the panel; `Dashboard` (web) and `WidgetSlot`
  (native) render the widgets of the slots they are given, gated by the session's permissions.
- `PanelShell` frames an app's layout as one panel, holds navigation's breadcrumb trail (`BreadcrumbsProvider`; pages
  publish with `useBreadcrumb` from `@stackra/navigation/react`) and provides the confirmation dialog `useActionRunner`
  asks with. `useBreadcrumbs` is navigation's, re-exported here because the template imports it from here.
- `registerPanelPages()` (called by the generated web entry) registers the `panel` page navigation's `toPanel` renders
  (the panel's shell for the class) and the `resource` page `toResource` renders (the generic pages below), so every
  resource route has a page with no extra code.
- Built-in displays: KPI, KPI group, progress, list and Custom (the producing package's renderer, receiving
  `{ data, isRefreshing }`).

## Resource pages

Every `toResource(Resources.Order)` route renders a generic page, Filament-style, drawn with free `@stackra/ui`:

- **List** (`ResourceListPage`): the title, the header actions, and `DataTable` with the recorded columns (hidden ones
  left out, money in its currency, a list as its count), sort on sortable columns, `FilterBar` with search and the
  declared filters (an enum filter as a select, the trashed filter), cursor pagination (`nextCursor`, `hasMore`),
  row actions and the bulk bar. The read is the closed input `{ limit, cursor?, sort?, filter?, search? }`
  (`CrudService.table`); only declared sorts and filters are sent. `pageSize` defaults to 25.
  Filters beyond a value: `f.range` (a number range, sent as `{ op: "range", from, to }`), `f.dateRange` (two
  calendar days, or a `TimeRange` code the server resolves in the call's time zone), `f.compare(key, operator)`,
  `f.contains` (case-insensitive, needs a pg_trgm index) and `f.isNull` (yes or no). `tableInput` sends each in the
  wire form `@stackra/database`'s `TableFilter` reads. `.thenSort(key, direction)` adds up to two tiebreak keys to the
  default sort (a multi-key sort); a clicked column sorts alone. Gen refuses a sortable column, default sort key or
  filter on an unindexed path (`sort_not_indexed`, `filter_not_indexed`).
- **View** (`ResourceViewPage`): the get query read with the record id under its input key (`id`, `orderId`,
  `accountId`), the infolist's entries and sections in a `PropertyList`, the header actions and every relation manager.
- **Create and Edit** (`ResourceFormPage`, `mode`): the recorded form fields in a schema form over the create or update
  action's input. A field draws by its input type (switch, number, a select of the enum's codes, text) or as a picker
  over its options query; a grid and the steps of a set are drawn too. The schema validates on submit; a refusal's
  `fieldErrors` show on their fields; a done run opens the record's View page (else the list). Edit starts from the
  record, its id under the input's id key.
- **Relation managers** (`RelationManager`): the related list query's table, its input bound from the record.
- **Actions**: placed actions follow ADR 0307 rule 3 (`placementsAt`): a record action on the row, View and Edit, and in
  the bulk bar with `.bulk()` (one run per selected record); an action without a record in the list header. View and
  edit links, the create link and delete (`operations.delete`) are derived. Every run goes through `useActionRunner`.
- **Labels** are derived: `<module>::resources.<model>.title`, `.columns.<path>`, `.filters.<path>`, `.entries.<path>`,
  `.sections.<name>`, `.fields.<path>`, `.steps.<name>`, `.relations.<model>` and `.actions.<verb>` (paths in
  snake_case).

The generated web entry calls `registerResources({ "orders.order": tree })` with the trees gen records; a resource with
no registered tree still gets every page, showing the row's, the record's and the input's own keys.

**Native.** The pure parts live in `.`'s internals so `./native` can import them by path: `tableInput` (the closed list
input), `placementsAt`, `recordIdKey`, `inputKind`, `resourceLabel` and `resourceTreeOf`. The native pages are not
built: `@stackra/ui/native` has no `DataTable` or `FilterBar` yet (gap-analysis P1), so a native list, filter bar,
bulk bar and form page wait for those.

## Not built yet

On the resource pages: the built-in View as JSON, clone and activity tab (ADR 0334), saved views and grouping on the
List, the modal form of a record action that needs more than the id, a selection-input (`Selection<...>`) action, the
upload and repeater fields, the step wizard (steps show one under another), the id a create mints for its PUT address,
enum labels (codes show), the native pages, and nesting the resource routes under the panel shell. Elsewhere: the
queued export and import pipelines with the `ImportMapper` port, the Chart, Table, Timeline, Banner and
Check displays, the `NumberMetric`, `PercentMetric` and `DurationMetric` shapes, the scope and user layouts (layers 4
and 5) and the KPI drill-down links and sparklines. See the spec's open items.

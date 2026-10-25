# @stackra/panel

Stackra's panel: the admin and portal surfaces modules declare and one renderer draws (ADR 0164, ADR 0307). A module
declares a `Resource` (one model's List, View, Create and Edit pages in one area), a `Widget` (a query bound to a
display), a `Document` (a saved Page or Dashboard of registered blocks) and an app declares its `Panel`s. Builders are
pure: gen runs each member once and records the tree in the manifest. The query computes every number; the panel only
presents it.

**Tier:** `tier:lib` (`packages/experience/panel`). Entries `.`, `./react` and `./native` (the old `./schemas` is folded
into `.`). Depends on `@stackra/actions`, `@stackra/clients`, `@stackra/container`, `@stackra/contracts`,
`@stackra/errors`, `@stackra/experience`, `@stackra/i18n`, `@stackra/iam`, `@stackra/icons`, `@stackra/money`,
`@stackra/query`, `@stackra/ui`, `@stackra/validation` and zod. React and React Native are optional peers.

## What is here

| Entry      | Symbol                                                                                                                                                                      | Use                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `.`        | `Resource<M, R?>`, `Widget<Q>` (`Widget.place`), `Document`, `Panel`                                                                                                        | the four kinds                                                |
| `.`        | `Table`, `Views`, `Form`, `Infolist`, `Relations`, `Actions`, `Display`, `CreateInput` (t)                                                                                  | what the builder members receive                              |
| `.`        | `CountMetric`, `MoneyMetric`, `TimeRangeInput` and `CountMetric$`, `MoneyMetric$`, `TimeRangeInput$`                                                                        | metric output shapes and the period input, with their schemas |
| `.`        | `ActionPlace`, `Count`, `DisplayKind`, `DocumentKind`, `DocumentLayout`, `ExportFormat`, `ImportMode`, `Place`, `PlacementLayer`, `ResourcePage`, `TimeRange`, `WidgetSize` | enums                                                         |
| `.`        | `Bind`, `Drill`, `DateRange`, `Blocks`                                                                                                                                      | binds, drill-downs, date filter values, document blocks       |
| `.`        | `Column`, `Filter`, `View`, `Entry`, `Section`, `Relation`, `Placement`, `FormField`, `FormStep`, `WidgetDisplay`                                                           | the data constructors gen writes into `#stackra/resources`    |
| `.`        | `slots`, `panels`, `resource`, `document`, `widget`, `registerWidgets`                                                                                                      | what gen calls in `#stackra/slots`, `panels`, `resources`     |
| `.`        | `describeResource`, `describeWidget`, `resolvePlacements`                                                                                                                   | what gen records; the placement layer rule                    |
| `./react`  | `PanelShell`, `usePanel`, `useBreadcrumbs`, `useBreadcrumb`                                                                                                                 | the panel frame and its breadcrumb trail                      |
| `./react`  | `Dashboard`, `WidgetTile`                                                                                                                                                   | the widget grid of a panel's slots, one widget as a card      |
| `./react`  | `useActionRunner`, `ActionRunStatus`                                                                                                                                        | run any action through its declared confirmation              |
| `./native` | `WidgetSlot`                                                                                                                                                                | a slot's widgets on mobile                                    |

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
      .filters((f) => [f.from("status").pinned()])
      .defaultSort("createdAt", SortDirection.Desc);
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

## Forms: `FormField` and `FormStep`

The form's element and step constructors are named for their kind: a bare `Field` is `@stackra/validation`'s field
decorator and a bare `Step` is a workflow step (ADR 0294 decision 23, one meaning per word). Inside a `form(f)` member
the builder methods stay `x.from`, `x.grid`, `x.steps`, `x.step`, `x.upload` and `x.repeater`.

## Rendering

- `registerWidgets(widgets)` hands a member's generated widget table to the panel; `Dashboard` (web) and `WidgetSlot`
  (native) render the widgets of the slots they are given, gated by the session's permissions.
- `PanelShell` frames an app's layout as one panel and provides the confirmation dialog `useActionRunner` asks with.
- Built-in displays: KPI, KPI group, progress, list and Custom (the producing package's renderer, receiving
  `{ data, isRefreshing }`).

## Not built yet

The generic resource pages (list, view, form, relation managers, the built-in View as JSON, clone and activity tab of
ADR 0334), the queued export and import pipelines with the `ImportMapper` port, the Chart, Table, Timeline, Banner and
Check displays, the `NumberMetric`, `PercentMetric` and `DurationMetric` shapes, the scope and user layouts (layers 4
and 5) and the KPI drill-down links and sparklines. See the spec's open items.

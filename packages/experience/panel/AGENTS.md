# AGENTS — @stackra/panel

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/panel: where code goes, the package rules (shell slots and the generic resource
         pages included) and the rules that fail the build.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0164; ADR 0307; ADR 0306; ADR 0336; ADR 0350; ADR 0438 (shell slots, stackra-03); ADR 0490 (page context, STA-1631).
-->

The panel: the `Resource`, `Widget`, `Document` and `Panel` kinds, their pure builders, the metric shapes and the time
range input, typed slots and placement layers, the data constructors gen writes, and the web and native renderers
(ADR 0164, ADR 0307, ADR 0306, ADR 0336 layer 2b). Member at `packages/experience/panel` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./react`, `./native`, `./node` (server only: the saved view store).

## Where code goes

| You are writing…                                   | It goes in…                                               |
| -------------------------------------------------- | --------------------------------------------------------- |
| A kind base                                        | `src/core/bases/<name>.base.ts`                           |
| An enum                                            | `src/core/enums/<name>.enum.ts`                           |
| A data constructor gen writes (`Column`, `Blocks`) | `src/core/constants/<name>.constant.ts`                   |
| A shipped schema (`X$`)                            | `src/core/constants/<name>-schema.constant.ts`            |
| A shape class                                      | `src/core/schemas/<name>.schema.ts`                       |
| A public builder or node type                      | `src/core/types/<name>.type.ts`                           |
| The runtime side of a builder type                 | `src/core/records/<name>.record.ts` (internal)            |
| A pure function                                    | `src/core/functions/<name>.function.ts`                   |
| A web component or hook and its props              | `src/react/<name>/<name>.tsx`, `<name>.props.ts`          |
| A native component and its props                   | `src/native/<name>/<name>.tsx`, `<name>.props.ts`         |
| A lang string                                      | `assets/lang/<locale>/panel.json`                         |
| A port                                             | `src/core/ports/<name>.port.ts`                           |
| A refusal                                          | `src/core/errors/<name>.error.ts`                         |
| A server model, migration, service or driver       | `src/node/{models,database/migrations,services,drivers}/` |
| A test                                             | `__tests__/<name>.<kind>.test.ts(x)` beside it            |

## Entries and barrels

- `src/{core,react,native}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new
  public file to its barrel and to that entry's `index.test.ts`.
- `core` imports no React; `react` and `native` import `core` and never each other. `node` imports `core` and never
  `react` or `native`; nothing outside `node` imports `node`.
- The breadcrumb trail is navigation's (`BreadcrumbsProvider`, `useBreadcrumb`, `useBreadcrumbs` in
  `@stackra/navigation/react`); panel depends on navigation, never the reverse. `./react` re-exports `useBreadcrumbs`
  only because the template imports it from here.
- The records, the widget and resource registries, `PANEL_KEYS`, `widgetsFor`, `widgetInput`, `widgetTitle`, `toneOf`,
  `changeOf`, `valueAt`, `resourceTreeOf`, `resourceLabel`, `tableInput`, `placementsAt`, `recordIdKey`,
  `actionFormKeys`, `fieldsForInput`, `enumLabelKeys`, `listCellCurrency` and `inputKind` are internal: `react` and `native` import them by path, and no barrel exports them.
- `pageContextOf(listState, record, selection)` is the panel's AI page context (ADR 0490 decision 5): pure, structural
  (`PanelPageContext`), ids and filter keys only. Panel imports no `@stackra/ai`; the SDK reads its result.
- Case helpers (`snakeCase`) come from `@stackra/support`; never add a copy here (stackra-224).

## This package

- Builders are pure. A builder method reads only its argument; gen runs it once on an object with the class's
  prototype (`describeResource`, `describeWidget`), so a member never touches `this`.
- Every node is built by its data constructor (`Column.from`, `WidgetDisplay.kpi`); a record only collects flags and
  calls the constructor, so authored and generated trees hold the same nodes.
- No raw strings in icon, column-key, route-key or permission positions in authored code (R-56): keys are typed paths,
  routes are `PageRef`s, permissions come from the generated `<Model>Permissions`.
- The form's constructors are `FormField` and `FormStep`, never `Field` or `Step` (ADR 0294 decision 23).
- Placements carry a `PlacementLayer`; a higher layer's placements replace a lower layer's whole set and never merge.
  `2b` is the edition layer (ADR 0336).
- No tenant vocabulary: layer 4 is a scope node's copy (R-59).
- A filter's drawn value reaches the server only through `filterWireValue` (the `TableFilter` wire form); never send
  an ORM operator object from the page.
- A display mode is display only: `fieldsForMode` hides, never denies. A saved view stores declared keys only: a
  `ViewStore` driver checks `unknownViewKeys` on every save, `panel.view.share` before sharing, ownership before a
  change, and passes the view's `version` as `expectedVersion`. Never draw `groupRows` totals on a paged list.
  `SavedView`'s sort, grouping and totals are the shape classes `SavedViewSort`, `SavedViewGroup` and `SavedViewTotal`;
  never put a `@Field(zod)` hatch back on them.
- An export reads rows only through the resource's list query run as the reader (`ExportRunner`), never a table or a
  service directly, so per-row permissions hold. `@Classified` columns are dropped unless opted in under an L2
  permission; the link lives 24 hours and its issue is access-logged. Caps and folders are `ExportConfig`, never code.
- A `LineEntry` slot shows exactly one editor, the highest layer's; never merge editors.
- Shell slots (ADR 0438): `defineSlot<Props>` in the shell package, `fillSlot` in the product's UI package, each an
  exported const with static options so gen reads them. `Slot.props` is type-only; never set it at run time. A shell
  slot is not a `SlotRef` (a widget place); keep the two apart.
- Resource pages (`src/react/resource-pages/`) are generic: they read the route constants, the registered tree
  (`registerResources`) and the wire data, never a product's code. A resource without a tree still gets every page from
  the data's own keys. Every button runs through `useActionRunner`; nothing calls the transport directly.
  A record action whose input needs more than the id (`actionFormKeys`) opens `ActionInputModal`, once for a whole
  bulk selection; the modal is its confirmation (`{ confirmed: true }`).
- Resource labels are derived by `resourceLabel` (`<module>::resources.<model>.<part>.<path>`); never add a label
  option. Logic a native page needs too (list input, places, id key, input kind) goes in a pure `core` function.
- `SearchPalette` reads only generated search queries (`<model>.search`) through `useQuery`, one hook per source
  (`SearchPaletteGroup`); it never binds a key itself (the app's `Shortcut` opens it) and never imports
  `@stackra/search` (`SearchPaletteHit` mirrors `SearchQueryHit`).
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

The `./node` saved view store keeps `panel.stored_views`: a view's name, its owner's principal id (pseudonymous) and
the filter values a person chose, which may contain what they searched for. Rows are tenant-scoped. An export file
holds the rows the reader may see, without classified columns unless opted in; it sits behind a random name and a
24-hour signed link, and each link's issue writes an access record.

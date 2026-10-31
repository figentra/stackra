---
"@stackra/ui": minor
---

One data family (ADR 0505, breaking): nine public data components on the `useCollection` engine, `Table`,
`DataTable`, `DataGrid`, `List`, `DataView`, `ColumnEditor`, `FilterBar`, `FilterPanel` and `SavedViews`
(`variant` `menu`, `tabs` or `chips`). `CollectionColumn` is the one column type (`type` text, number, choice,
date or boolean, with `isEditable`, `isReadOnly`, `isRequired`, `min`, `max` and `validate`); `CollectionFilter`
is the one filter model (new operators `in`, `not_in`, `between`, `before`, `after`, `is_true`, `is_false`).
`DataTable` and `DataGrid` take `collection` or the shorthand `items` and `columns`; DataGrid's `rows`, `height` and
`frozenColumns` became `items`, `maxHeight` and a column's `pin`; Table's `sortDescriptor` became `sort[]`.
Removed: `ColumnChooser`, `SavedViewsMenu`, `ResourceQuery`, `ResourceQueryContractProps`, `FilterState`, the ui
`SavedView`, `DataGridColumn`, `DataGridCellType`, `DataGridOption`, `SortOption`, `FacetOption`, and the
`query`, `onQueryChange`, `filters`, `hiddenColumns`, `groupBy`, `aggregates`, `editableColumns`, `gridColumns`,
`onNext` and `onPrevious` props. No longer exported: `ColumnEditorPanel`, `ColumnMenu`, `CollectionFilterEditor`,
`CollectionSortEditor`, `DataViewCards`, `DataViewBoard` and `CollectionRowPanel`.

A column's `filter` sets its quick filter's editor: `placeholder` (text), `step` and `formatOptions` (number, a
currency say), `trueLabel` and `falseLabel` (yes or no) and `isDisabled` (listed but refused). The native
`DataTable` honours `hasColumnTools` with a `ColumnEditor` beside the filter bar.

`FilterBar` takes `unappliedIds`: the conditions and groups the data source does not apply are drawn as warning
chips, led by a warning button whose name and tooltip are the `ui` catalogue's "Not applied on the server".

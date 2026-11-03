---
"@stackra/panel": minor
---

The panel's server-driven UI specs (STA-1981). `@stackra/panel` adds the spec types `ActionButtonSpec`,
`EmptyStateSpec`, `RowActionsSpec`, `BulkActionsSpec`, `FormFieldSpec`, `FilterSpec` and `TableColumnSpec`, with the
`FieldControl` and `FilterKind` enums. A placed action, a column, a filter, a form field and the table now record that
look: `Placement.*`, `Column.*`, `Filter.*` and `FormField.from` take the fields, and each builder gains `with(look)`.
The generic resource pages draw it: a placement's icon, description, shortcut, tone, disabled reason and link, hidden
without its permission or while its `visibleWhen` record path is not true, its own confirmation words through the
action runner's new `confirm` option, and a bulk `runMode` of `once`; a column's header words, alignment, widths, pin,
wrap, resizing, row header, start hidden (a `hidden` column now stays choosable), inline edit through the update action,
aggregate and cell kind (badge, status, money, principal, date, link, copy); a filter's words, control, quick filter
settings and choices (an enum's codes by their labels); the table's sticky header, column tools, resize handles, search
words, filtered empty state, hover row actions and bulk bar name; the empty state's words, icon, reason and heading
level with its buttons drawn as action buttons; and a form field's words, required, disabled and read-only overrides,
named control, number bounds, grid span, choices and `visibleWhen`. `@stackra/panel/react` adds the kit's
`ActionButton`, `RowActions` and `BulkActions`. The showcase lists the three under Blocks.

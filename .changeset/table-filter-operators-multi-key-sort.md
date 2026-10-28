---
"@stackra/database": minor
"@stackra/panel": minor
"@stackra/gen": minor
---

Resource tables get the full filter and sort vocabulary (reporting gap 5, ADR 0307 rule 2). `@stackra/database`:
`CrudService.table` reads each filter value as a `TableFilter` (a value, a list, or `{ op }` for `range`,
`dateRange` with bounds or a named relative range resolved by the new `TableOptions.period`, `gt`/`gte`/`lt`/`lte`/`ne`,
`contains` and `isNull`) and a multi-key sort (`TableSort[]`, three keys at most, the primary key last). Any other
object filter value, which used to reach MikroORM as is, is now refused with `table_filter_invalid`
(`TableFilterInvalidError`). `@stackra/panel`: `Filter.range`, `Filter.dateRange`, `Filter.compare` with the new
`FilterComparison` enum, `Filter.contains`, `Filter.isNull` (and the same on the table builder's filter factory),
`.thenSort(key, direction)` tiebreak keys on the default sort, and `tableInput` sends each drawn value in its wire form;
the web list draws range, date-range and is-null filters with `@stackra/ui`'s number, date-range and boolean editors.
`@stackra/gen`: the full pass refuses a recorded resource table that sorts or filters on a path no index leads with
(`sort_not_indexed`, `filter_not_indexed`).

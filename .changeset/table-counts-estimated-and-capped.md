---
"@stackra/database": minor
"@stackra/panel": minor
---

`CrudService.table(input, { count })` adds the matching rows' count to the page (`page.count`, a `TableCount`).
`Count.Estimated` counts exactly up to 10,000 rows (`BULK_LIMITS.countCap`) and past it reports the cap with the
planner's estimate; `Count.Exact` counts every row (ADR 0307 rule 12, reporting gap 6). `Count` now lives in
`@stackra/database`; `@stackra/panel` re-exports it, and the resource list shows the count beside the filter bar,
capped as "10,000+" (new `panel::resources.count` and `count_capped` texts in all seven locales).

---
"@stackra/panel": minor
---

Preset views draw as tabs on the List page and can read their list query with a fixed input: `v.view("merged", {}).input({ includeMerged: true })`, typed by the query's input (`Views<R, QueryInput<typeof ListQuery>>`) and sent under the viewer's filters, sort, search and cursor.

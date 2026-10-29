---
"@stackra/cli": patch
---

`stackra search:reindex` loads `searchReindex` from the member's `@stackra/data-maintenance/node`, where the reindex
jobs now live; `stackra search:status` still loads `searchStatus` from `@stackra/search/node` and needs no add-on.

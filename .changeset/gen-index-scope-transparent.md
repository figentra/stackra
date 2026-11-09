---
"@stackra/gen": patch
---

The resource-table index check reads an `@Index` that leads with the scope column (`tenantId` or `scopeId`) as serving
its next column too, since row-level security already narrows a scoped table to one scope; a filter or sort on that
column is no longer refused as `filter_not_indexed` / `sort_not_indexed`.

---
"@stackra/panel": minor
---

Saved views, finished (STA-1489, reporting gap 7). `ViewStore` is now a port, and a new `./node` entry ships its
`database` driver `DatabaseViewStoreDriver` over `panel.stored_views` (tenant policy, `version` column, migration 0001),
with `StoredView`, `StoredViewService` and `ViewPermissions.share` (`panel.view.share`). `SavedView` gains `layout`
(`ViewLayout`: table, board, gallery, calendar, chart) with `layoutBy`, `version`, and role copies
(`ViewSharing.Role` with `role`). The server validator `unknownViewKeys` refuses undeclared keys with
`ViewKeyUnknownError` (`view_key_unknown`). `ResourceListPage` takes a `views` store and draws saved views as tabs; the
native entry adds `SavedViewTabs`. New dependencies: `@stackra/database`, `@stackra/model`, `@stackra/tenancy`.

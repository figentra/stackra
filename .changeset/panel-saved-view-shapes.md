---
"@stackra/panel": minor
---

Saved view shapes (STA-1489). `SavedView.sort`, `group` and `totals` (and `StoredView`'s) are now the shape classes
`SavedViewSort`, `SavedViewGroup` and `SavedViewTotal`, exported with their shipped schemas `SavedViewSort$`,
`SavedViewGroup$` and `SavedViewTotal$`, so gen compiles them as shapes instead of zod hatches. `SavedView.filter` is
typed `Record<string, Json>`. The wire format is unchanged: `SavedView$` composes the three schemas.

---
"@stackra/market-packs": minor
---

`FloorBound.List`: a list floor a value may add to but never drop from; `MarketPack$` requires a list value and
`overlayFloorIssues` reports an overlay that drops an item. `ResolveOptions.requireBase: false` resolves product
sections for a market with no base pack, nesting by market code. `pickPack` is exported from the `.` entry (ADR 0455,
STA-917).

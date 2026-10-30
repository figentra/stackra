---
"@stackra/panel": minor
---

A View page's list entry formats its cells like any value: a `…Minor` cell is money in the item's own `currency`, else
in the record's currency named by the new `e.list(key, columns, { currency })` option, instead of raw minor units.

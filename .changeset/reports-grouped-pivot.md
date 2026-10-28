---
"@stackra/reports": minor
"@stackra/panel": minor
"@stackra/database": patch
---

Reports return server subtotals per leading dimension (`subtotals: true`) and a pivot matrix with row and column
totals (`pivot: { rows, columns }`), all from one grouping-sets statement. The panel's `Aggregate` is now
`@stackra/database`'s (`average` becomes `avg`, `distinct` is added); `groupRows` is for fully loaded tables only.

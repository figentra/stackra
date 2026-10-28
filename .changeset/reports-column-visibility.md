---
"@stackra/reports": minor
"@stackra/iam": minor
---

Report dimensions and measures take a `permission` and a `dataClass`. The report runner checks the caller's column
permissions through the decision point and drops what it may not see (a classified column needs a permission; a formula
over a hidden measure hides too); a filter on a hidden column is forbidden. `@stackra/iam` adds `hiddenColumns` and
`ColumnRule`.

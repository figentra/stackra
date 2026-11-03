---
"@stackra/gen": patch
---

`sort_not_indexed` and `filter_not_indexed` now judge the resource trees gen reads in this run, not the committed
`stackra.manifest.json`. A sortable column, default sort, tiebreak key or filter on a path no index leads with is
refused in the run that adds it, including a first run with no committed manifest; a tree only the committed manifest
still holds is no longer judged. `checkTableIndexes(ir, manifest)` takes the manifest this run derives.

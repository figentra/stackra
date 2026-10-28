---
"@stackra/gen": patch
---

gen writes its committed JSON (`stackra.manifest.json`, `openapi.json`, `.stackra/graph.json`, `stackra.graph.json`
and the merged system graph) in oxfmt's shape through the new `formatJson`: arrays that fit in 100 columns sit on one
line. `oxfmt --check` now passes on the committed manifests without a format step; regenerate them once with
`stackra gen` to pick up the new layout. The content is unchanged.

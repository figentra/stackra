---
"@stackra/gen": minor
---

Emit the system graph (ADR 0452, stackra-59). Every full run writes `.stackra/graph.json` (`memberGraphOf`): modules,
called services, integration events published and consumed, tables, packages and ports with their driver candidates.
`writeRepoGraph` (`./node`) joins a repo's member graphs and its `stackra.flows.json` into `stackra.graph.json`, and
`mergeSystemGraphs` merges the os, commerce and product repo graphs into one; both use `systemGraph`, which resolves
call and event edges, derives `usedBy` and flow tags and lists the gaps.

---
"@stackra/repo-checks": patch
---

The layout check reads package.json `stackra.layout.banned`: a repository lists retired names, and any path carrying one
(in any case, outside `adr/` history) is a finding.

---
"@stackra/repo-checks": patch
---

The layout rule reads the `@stackra/flow-preset` preset as the stackra template, so a repository that names the package
(T142) keeps its root entries. The format rule keeps the preset package's `surfaces/opencode.jsonc` and
`surfaces/settings.json`, which Flow reads by exact name.

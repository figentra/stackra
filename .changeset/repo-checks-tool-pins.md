---
"@stackra/repo-checks": patch
---

`checkToolPins` and the `tool-pins` finding of the `config` phase: every `"npm:<name>" = "<version>"` pin in `mise.toml`
must match a `pnpm-workspace.yaml` catalog pin, so the commit hooks' oxlint and oxfmt run the members' versions
(STA-1865).

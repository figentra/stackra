---
"@stackra/runway": minor
"@stackra/cli": minor
---

Add a local edge for a built web surface (STA-1676). `@stackra/runway`: `LocalEdgeKvDriver`, a file-backed
`EdgeKvWriter`; `previewServe`, which writes the bundle's `release:` and the shell's `shell:` rows into it with every URL
on its own origin and serves on 127.0.0.1 as the edge Worker does (the shell page with its import map and startup
record, the bundle and shell files, and an API proxy for `/api` or given prefixes); `renderShellPage`; and `releaseOf`,
now shared with `publishProduct`. `@stackra/cli`: `stackra preview serve --surface <key> [--port] [--api]
[--api-prefix] [--region]`.

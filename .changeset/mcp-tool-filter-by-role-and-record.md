---
"@stackra/mcp": minor
---

`filterTools(tools, access, scope)` filters by role and record scope, drops a tool the AI permission matrix sets to off,
and marks an unentitled tool `locked: true` instead of returning a separate `locked` list.

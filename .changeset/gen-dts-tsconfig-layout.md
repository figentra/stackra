---
"@stackra/gen": patch
---

A package's generated `tsconfig.build.json` is written in oxfmt's layout (short arrays on one line), so a member's
`oxfmt --check` passes on the file exactly as gen writes it.

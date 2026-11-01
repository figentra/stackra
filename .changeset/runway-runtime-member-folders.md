---
"@stackra/runway": patch
---

`deployPlan` gives each member's runtime secrets their own folder, `<runtime path>/<member>` (for example
`/runtime/web`), as ADR 0512 and ADR 0371 decision 3 require (STA-1867).

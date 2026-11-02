---
"@stackra/gen": patch
---

Gen hosts a package's commands only in a service (STA-2023). An app keeps its own commands and gets a console entry
only when it has some, so a native app no longer imports a package's `./node` entry or needs `@stackra/console`.

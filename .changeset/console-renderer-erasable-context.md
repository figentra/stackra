---
"@stackra/console": patch
---

`TextRendererDriver` declares its `context` as a field instead of a constructor parameter property, so the package source typechecks under the `node` TypeScript preset (`erasableSyntaxOnly`). A member on that preset that imports `@stackra/database` (the docs app's task guides) reached this file through it and failed its typecheck with TS1294. Nothing else changes.

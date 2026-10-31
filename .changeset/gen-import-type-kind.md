---
"@stackra/gen": patch
---

A class whose shipped `.d.mts` base is typed `import("@stackra/config").ConfigClass<…>` keeps its kind: the reader
takes the import type's qualifier when the base has no type name (STA-1738).

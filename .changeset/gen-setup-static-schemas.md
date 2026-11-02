---
"@stackra/gen": patch
"@stackra/container": patch
---

A member's generated Vitest setup imports each generated schemas file statically and calls the new
`markMemberSchemasLoaded()` from `@stackra/container/testing`, instead of awaiting `loadMemberSchemas()`. In a
consumer, `@stackra/container` sits in node_modules, which Vitest leaves to Node, so the schemas loaded through Node:
with no `#` imports-map fallback and no legacy decorators, every unit test failed at import (STA-2032).

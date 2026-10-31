---
"@stackra/gen": patch
---

A service's generated `.stackra/tsdown.config.ts` annotates its default export `ReturnType<typeof library>`, like a
package's already does, so it no longer fails typecheck with TS2883 when tsdown is not the service's own dependency
(STA-1743).

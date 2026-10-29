---
"@stackra/gen": patch
---

A driver over another package's base imports its port from that package's entry (`@stackra/search/contracts`), not
the base's own `#contracts/index` path, which the member cannot resolve.

---
"@stackra/csp": minor
---

`frameAncestorsEntry(config, path)` is exported: the `frameAncestors` entry that governs a path (an exact key, else the
longest `/*` prefix). A runtime uses it to ask its resolver only on a `"request"` path, as the edge Worker does.

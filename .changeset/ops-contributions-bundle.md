---
"@stackra/runway": minor
"@stackra/repo-checks": patch
---

`buildProduct` writes a product's `surfaces.ops.contributes` as a declarative `ops` bundle (the contributions file and its manifest, targeting `ops@1`), and `publishProduct` uploads it and writes its canary or release row like any surface. The root runway schema no longer marks `surfaces.ops.contributes` and its fields "Not read yet", and the list of runway fields not yet read drops them.

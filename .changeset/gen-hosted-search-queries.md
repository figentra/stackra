---
"@stackra/gen": patch
---

A service that hosts a package with a searchable model (`@stackra/loyalty-kit`'s `LoyaltyAccount`) now derives
that model's `Search<Model>Query` into its own `#stackra/search` and imports it from there. The package's own copy
lives in its unpublished `.stackra/gen`, so the host's registrations used to import a class the package does not
export (TS2305).

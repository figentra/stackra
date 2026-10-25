---
"@stackra/registry": minor
---

Add `@stackra/registry`, module catalogue validation for a registry service: the `CatalogueManifest` shape of a
published `stackra.manifest.json` with its shipped schema, and `validateCatalogue`, which checks a set of manifests for
shape, duplicate members, identity collisions, unknown modules, foreign namespaces, unknown dependencies and dependency
cycles, returning `CatalogueDiagnostic` values with a `CatalogueDiagnosticCode` in an order that does not depend on the
order of the input.

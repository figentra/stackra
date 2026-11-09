---
"@stackra/repo-checks": patch
---

`catalogEncoreVersion` now also reads pnpm's `catalogs.default` form of the default catalog, which is where fflow keeps its pin. Before this, `stackra encore:prepare` and the service check found no `encore.dev` version in such a repository. The top-level `catalog:` form still wins when a file has both.

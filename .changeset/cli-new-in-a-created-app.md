---
"@stackra/cli": minor
---

`stackra new` works inside an app made by `stackra create` (STA-1954). The CLI now ships the scaffold templates as
`dist/scaffold-templates`, so `app:console`, `app:mobile`, `app:desktop`, `app:docs`, `tooling` and a package with
`--entries` or `--data` render in a repository without core's `tools/scaffold/templates` (a workspace that has its own
still wins). A rendered member takes the target's catalogs: each `catalog:` or `workspace:` dependency points at the
catalog that holds the package (`catalog:` for React, `catalog:stackra` for the framework in a product), and
`stackra new` names any package no catalog holds. A package is named as `stackra new package` names it (the product's
name in a product). `stackra new package` makes a standard category's folder when it is missing, since a created app
starts with no `packages/`. `--dry-run` now writes nothing for every kind and lists the files it would write
(STA-2616). The package template's config and root module are the `Config` and `Module` kinds (with an options
schema and their dependencies), and it no longer authors `tsdown.config.ts` or `vitest.config.ts`, so `stackra gen`,
typecheck, test and build pass on a new package.

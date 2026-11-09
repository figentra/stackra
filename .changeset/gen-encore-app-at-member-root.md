---
"@stackra/gen": minor
---

A service's Encore app root is the member root: gen writes `encore.app` at `services/<name>/encore.app` (gitignored) and no longer writes `.stackra/encore/encore.app` or `.stackra/encore/package.json`, so Encore resolves the member's `node_modules` and, with the tsconfig `paths` block, its `#` imports. The generated services stay in `.stackra/encore/<svc>/`. `encore_app_stray` now refuses only an `encore.app` at the repository root. Breaking: `emitEncorePackage` is removed.

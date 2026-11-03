---
"@stackra/skills": minor
"@stackra/repo-checks": minor
"@stackra/cli": patch
---

Add the `docs` registry kind (STA-1920, ADR 0514 decision 10). `StackraKind.Docs` is a product's content-only docs
package, `@figentra/<product>-docs`: MDX pages and their Fumadocs `meta.json` in `content/`, plus assets, with no code.
`STACKRA_MANIFEST_SCHEMA` accepts `{ "kind": "docs" }` with nothing more. `pnpm validate` places a docs package at the
repository's `docs/`, asks for no tier, turbo.jsonc or tsconfig, requires `content/`, and treats it as UNLICENSED like
an app. `stackra add` never installs one: the docs hub depends on it.

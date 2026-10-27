---
"@stackra/gen": minor
"@stackra/cli": minor
"@stackra/runway": minor
---

Docs site target (stackra-176): gen assembles a docs app's Mintlify root into `.stackra/site` from a typed `DocsConfig`
(pages in `src/docs`, assets in `src/assets`, snippets in `src/snippets`) with the `docs_*` refusals; `stackra
dev|build|lint` run Mintlify in the generated site; runway's `MintlifyProviderDriver` (now a `Driver(RunwayProvider)`,
so runway depends on `@stackra/container`) publishes it as an orphan commit to `targets.mintlify.branch`.

---
"@stackra/gen": minor
---

A service's gen run writes `.stackra/encore/encore.app` (`{ id, lang: "typescript" }`) from the root runway's
`providers.encore.app`, so `stackra dev` (`encore run` in `.stackra/encore`) finds its app. A root runway without the key
is refused as `encore_app_missing`; an `encore.app` at the member or repository root is refused as `encore_app_stray`
(ADR 0091 decision 2, ADR 0029, STA-1322).

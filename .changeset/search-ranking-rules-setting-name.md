---
"@stackra/search": patch
---

`SearchSettings` names its ranking rules `rankingRules` (`search.rankingRules`), since `rules` is the settings base's
cross-field rules method; the package declares its `@stackra/actions` dependency; the generated search query's
`arabizi` input is a plain boolean field and its output schema lives in its own constant.

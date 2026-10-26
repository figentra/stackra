---
"@stackra/search": minor
---

Count facets under record visibility (`SearchDriver.facets`, `SearchIndex.facets`), fold Arabic through `@stackra/i18n`'s
`normalizeArabic` with the new `search.fold` SQL function (migration 0003; reindex plan in ADR 0404), read the
embedder token from the runtime `SecretStore` (`search.embedder.tokenSecret` replaces `tokenEnv`), and pin the
Spanish, Italian and Dutch analysers (STA-787, STA-788).

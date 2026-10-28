---
"@stackra/search": minor
"@stackra/panel": minor
---

Add the search API and the Cmd+K palette (ADR 0221 d4 and d6, STA-1459): `SearchQuery(Model)` in
`@stackra/search/node` is the base of the `<model>.search` query gen writes per `@Searchable` model, answering a phrase
with hits of key, title and snippet under the caller's visibility (`SearchQueryInput`, `SearchQueryOutput`,
`SearchQueryHit`); a public search is the same query with anonymous actors in the public area. `SearchPalette` in
`@stackra/panel/react` searches those queries as the reader types and hands the picked hit to the app.

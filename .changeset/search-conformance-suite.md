---
"@stackra/search": minor
---

<!-- Purpose: release note for stackra-195: the SearchDriver conformance suite in @stackra/search/testing. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0089 d5, ADR 0461. -->

Add the `./testing` entry with the `SearchDriver` conformance suite (ADR 0089 d5): `runSearchConformance(makeDriver,
options?)` runs `SEARCH_CONFORMANCE_CASES` (every word, prefixes, alternatives, filters, offset and limit, facets,
re-indexing, removal, refusing record visibility) on a fresh driver over its own `conformance_<case>` table seeded with
`SEARCH_CONFORMANCE_DOCUMENTS`, and returns each case's mismatches. Framework-free and importing only `./contracts`, so
the Pro Meilisearch and OpenSearch drivers (ADR 0461) run the same rules as the memory driver.

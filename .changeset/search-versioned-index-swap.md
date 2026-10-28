---
"@stackra/search": minor
---

Versioned index swap (ADR 0221 d7, stackra-303). `SearchTable.version` addresses an index version; `SearchDriver`
gains `prepare(table, version)` and `swap(table, version)` (the default refuses). `MemorySearchDriver` keeps a shadow
per table, writes it beside the live index and swaps it in at once. `PostgresSearchDriver` writes and clears the
`__v<n>` shadow columns beside the live ones, writes one version alone for a rebuild, reads the live columns only, and
leaves the swap to the contract migration. `t.searchable({ ..., version })` writes the shadow columns (the expand
step). `SearchIndex.prepare`, `swap` and `reindex({ version })`; `ReindexSearchInput.version` runs a versioned rebuild
and swap; migration `search.0006_add_search_index_version` and `SearchIndexStatus.version` record it.

---
"@stackra/ledger": minor
---

Add `@stackra/ledger`: `Journal<M>` over an append-only entry model (idempotent appends, balances derived from entries,
debits refused below a balance floor, set-based reversals cut at the floor, balanced postings), the `@Journaled` facet,
the `journalOf` token and `UnbalancedPostingError`.

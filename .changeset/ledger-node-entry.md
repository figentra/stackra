---
"@stackra/ledger": minor
---

Add the `./node` entry: the database-bound `Journal` service and the `journalOf` token move there, so `.` keeps only
`Journaled`, `UnbalancedPostingError` and the types and loads in any runtime. Import `Journal` from
`@stackra/ledger/node`. Add the `currency` field to the `@Journaled` facet: a posting's lines share one ISO 4217
currency (else `UnbalancedPostingError`, which now carries `currencies`) and balances are per currency.

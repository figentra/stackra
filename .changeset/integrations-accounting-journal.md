---
"@stackra/integrations": minor
---

Breaking renames for unique public names (STA-1383): the accounting-export types `JournalEntry` and `JournalLine` of
`@stackra/integrations/contracts` are `AccountingJournalEntry` and `AccountingJournalLine`, so `JournalEntry` and
`JournalLine` are only `@stackra/ledger`'s.

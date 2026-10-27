---
"@stackra/ledger": minor
---

`Journal` writes extra typed model fields beside its own five: `@Journaled({ extra: ["locationId", "lotId"] })` lists
them, `JournalEntry.extra` fills them (typed by the model), `find`, `lines` and `reverseWhere` read them back, and a
reversal keeps its original's. An unlisted extra key is a `TypeError` before any write (STA-918).

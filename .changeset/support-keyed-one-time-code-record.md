---
"@stackra/support": minor
---

Breaking: `OneTimeCodeRecord` of `@stackra/support` (the key-id record of `oneTimeCode`) is renamed
`KeyedOneTimeCodeRecord`, so it no longer collides with `@stackra/validation`'s purpose-bound `OneTimeCodeRecord`
(STA-1383).

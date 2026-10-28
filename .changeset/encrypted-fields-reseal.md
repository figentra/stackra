---
"@stackra/model": minor
---

Finish key rotation for encrypted fields (gap gov7). `EncryptedFieldsResealService.usage` reports how many sealed
values rest under each data key and how many rows are still off the current key, so an old key can be retired;
`reseal` opens and seals again, a page at a time with a resumable cursor, every value still under an older key, with
the scope's cipher or the subject's for a subject-sealed model, and never overwrites a row a write changed meanwhile.

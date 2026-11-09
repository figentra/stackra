---
"@stackra/gen": patch
---

A model whose last word is already plural keeps it in its derived table name and resource path. `OpeningHours` is now `opening_hours`, no longer `opening_hourses`. The same goes for `news`, `series`, `settings`, `analytics`, `species`, `preferences` and the rest of `INVARIANT_PLURALS`. Regular nouns that end in `s` (`address`, `class`, `bus`) still take `es`.

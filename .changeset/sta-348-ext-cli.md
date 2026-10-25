---
"@stackra/cli": minor
---

Add `stackra new <package|service|seed-pack> <name>`, which writes members in the programming model v3 shape and
product seed pack skeletons, and `stackra seed-pack <product>`, which checks a `seed-pack:<product>` (`--check`) or
seeds its `minimal`, `demo` or `test` profile through the member's seed runner, writing only new and changed
seed-owned records and never a record a tenant changed.

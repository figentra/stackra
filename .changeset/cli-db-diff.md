---
"@stackra/cli": patch
---

`stackra db diff [--json]` compares the member's models with the schema its compiled migrations build, with no
database and no network. It prints `<module>  <table>  <kind>  <subject>  <expected>  <actual>` per difference (or a
JSON array) and exits 0 when they agree, 1 on a difference, and 2 when a migration does not compile or replay, or
`@stackra/database` or PGlite is not installed in the member.

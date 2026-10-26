---
"@stackra/database": minor
---

Add the `inherited` row-level-security match (ADR 0412): the `ancestor` policy plus a select-only
`pol_<table>_<column>_inherited` policy, so rows seeded at the platform or product node are read, never written, by
every tenant below them.

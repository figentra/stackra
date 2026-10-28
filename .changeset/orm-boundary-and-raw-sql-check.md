---
"@stackra/oxlint-config": minor
"@stackra/repo-checks": minor
---

Enforce the ORM boundary and the raw SQL reason (gap mo23, ADR 0097 amendment of 2026-10-29). `boundaries.jsonc`
bans `@mikro-orm/*` imports outside `@stackra/database`; `@stackra/model` may take `Collection`, `Ref` and `Reference`
from `@mikro-orm/core`, and its ORM adapters the rest. `checkRawSql` (rule `raw-sql` in the structure phase) holds
every raw SQL call in member source to a `// raw-sql:` reason (ADR 0160), with `RAW_SQL_BASELINE` as a ratchet for
the calls that had none.

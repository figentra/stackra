---
"@stackra/database": patch
---

`assertRowSecurity` now treats a table in the expand step of the scope-path migration as a warning until 0.20, not a failure. That is a table with a nullable owner column, no `pol_<table>_<column>` policy yet, and its permissive `scope_path` policy still in place. The warning reads "(a) ancestor scope_path table in the expand step, awaiting backfill and the contract step". It is a failure under `strict: true` or `STACKRA_GEN_STRICT=1`. A NOT NULL owner column, or a table without that `scope_path` policy, still gets every hard check.

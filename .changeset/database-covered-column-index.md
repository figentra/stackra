---
"@stackra/database": patch
---

A blueprint that declares an index on a link column alone (`t.unique(["scope_id"])` beside `t.scopeId()`) no longer also
writes the column's own plain index. Both took the name `idx_<table>_<column>`, so the migration failed with "relation
already exists"; the declared index serves the column.

---
"@stackra/database": patch
"@stackra/gen": patch
---

`assertRowSecurity` stages its every-table check like gen's tenancy checks. Until 0.20, an unlisted table without the owner column is a warning, not a failure. `assertRowSecurity` now returns these warnings. Each one names the table's group, read from the catalogue:

- an ancestor `scope_path` table awaiting the contract step;
- a `scope_id` table whose policy reads the owner setting;
- a system table with no row-level security, awaiting its ADR decision;
- otherwise, unclassified.

With `strict: true` or `STACKRA_GEN_STRICT=1`, these tables fail the audit as they will from 0.20. Every other finding still fails at once: the policy shape of an owned table, the probe's checks, a listed table that holds the column, and a listing with no reason.

gen's tenant-isolation test now prints each warning and passes when the audit returns only warnings.

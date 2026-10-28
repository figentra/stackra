---
"@stackra/database": minor
---

A foreign key or enum check added to an existing table (`schema.table`) now compiles to `ADD CONSTRAINT ... NOT VALID`
in the migration's transaction plus one `VALIDATE CONSTRAINT` step per constraint after it, so the add takes no scan
and validation lets writes continue (ADR 0159 d3, stackra-251). Constraints on a created table stay inline. CI lints
the compiled `.up.sql` files with Squawk.

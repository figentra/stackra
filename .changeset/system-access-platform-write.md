---
"@stackra/database": patch
---

A platform-form table that declares `t.systemAccess` update columns now lets the system-access role through its
restrictive `pol_<table>_<column>_write_update`. Before this, a claim function run with no tenant (a relay, queue,
scheduler or workflow lease) reached only the platform's NULL rows and silently skipped every tenant row, because a
restrictive policy binds every role. The policy compiles as `(<own rows>) or current_user = 'stackra_system_access'`;
the role's column grants still keep it to the lease columns, and `_write_delete` is unchanged (the role has no
DELETE). `assertRowSecurity` accepts that suffix only on a table with `pol_<table>_system_access_update`, requires it
there, and otherwise holds `_write_update` to exactly what `_write_delete` tests. Declare the platform form and
`t.systemAccess` in the same blueprint.

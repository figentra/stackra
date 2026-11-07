---
"@stackra/database": patch
---

`CrudService.lock` flushes the unit of work before its refreshing read. Locking one row twice in a transaction used to
drop a value assigned (and not yet flushed) since the first lock, so every invoicing document was numbered 1. An added
column whose default is a setting (`defaultSetting`) now carries `-- squawk-ignore adding-field-with-default` and its
reason in the compiled SQL (`current_setting()` is STABLE, so there is no table rewrite), which clears every host's squawk
on `database.0006_add_isolation_scope`. Lint comment lines are left out of a migration file's checksum, so a file
already applied keeps its checksum.

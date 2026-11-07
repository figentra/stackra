---
"@stackra/database": patch
---

A `requiresNew` transaction now runs in the caller's scope and tenant. It opens on another connection, which had none
of the caller's transaction-local `app.*` settings, so under forced row-level security its insert was refused or its
`tenant_id` default wrote NULL. `runTransaction` now reads those settings from the running transaction before it opens
the new one and sets them first inside it, as `onReplica` already did for a replica (both share one helper now). This
also fixes `CrudService` `insert` and `update` with `requiresNew` and the webhook delivery attempts written that way
under row-level security. With no transaction running, nothing changes (STA-2565).

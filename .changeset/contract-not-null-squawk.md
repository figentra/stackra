---
"@stackra/database": patch
"@stackra/tenancy": patch
"@stackra/achievements": patch
"@stackra/rules": patch
"@stackra/segments": patch
"@stackra/content": patch
"@stackra/collaboration": patch
"@stackra/workflow": patch
"@stackra/webhooks": patch
---

The contract migrations (database 0007, achievements 0004, rules 0005, segments 0003, content 0006, collaboration
0004, workflow 0011 and webhooks 0003) now carry a reviewed squawk ignore, with its reason, above each `SET NOT NULL`
that the migration's pre-flight checked, so a product that hosts them lints clean. The runner hashes a migration
without its lint lines, so no checksum changes, and nothing runs differently.

New contract steps can set NOT NULL without scanning the table under an exclusive lock:
`t.belongsToTenant({ contract: true, safeNotNull: true })`, or `t.change(column).notNull({ safe: true })`, adds a
`NOT VALID` check, then validates it, sets NOT NULL and drops the check in a later step. The released migrations keep
their form.

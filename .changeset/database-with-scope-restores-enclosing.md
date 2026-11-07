---
"@stackra/database": patch
---

`Database.withScope` puts the enclosing scope settings back when it runs inside a running transaction. A released
savepoint keeps a `set_config(…, true)` until the outer transaction ends, so a nested call used to leave
`app.scope_id`, `app.scope_path` and `app.scope_paths` on the inner scope for the rest of the caller's transaction. The
nested call's writes are flushed before the settings go back, so they still land in its own scope.

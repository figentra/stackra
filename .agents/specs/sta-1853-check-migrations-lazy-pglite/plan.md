# Plan: checkMigrations loads PGlite lazily (STA-1853)

1. In `check-migrations.function.ts`, read `PGlite` and `extensions` from `loadPglitePeers()` only when no target is
   given, and run `extensionsSql()` instead of building the statements from `PGLITE_EXTENSIONS`.
2. Delete `testing/constants/pglite-extensions.constant.ts` and point the names constant's docblock at
   `loadPglitePeers`.
3. Add a patch changeset for `@stackra/database`.
4. Tests run in CI (the Mac runs oxfmt and oxlint only).

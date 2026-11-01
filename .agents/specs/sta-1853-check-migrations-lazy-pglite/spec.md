# checkMigrations loads PGlite lazily like the memory driver

**Linear**: STA-1853
**Status**: implementing
**Clarifications status**: complete

## Problem

`checkMigrations` (STA-1689) imports `@electric-sql/pglite` and its contrib extensions at module load through
`PGLITE_EXTENSIONS`. The memory driver loads the same peers on first use through `loadPglitePeers` (STA-1812), so a
consumer of `@stackra/database/testing` without the optional PGlite peers fails on import, not on use.

## Change

- `checkMigrations` takes `PGlite` and the extensions from `loadPglitePeers()` when it makes its own database, and the
  `create extension` statements from `extensionsSql()`.
- `PGLITE_EXTENSIONS` (`testing/constants/pglite-extensions.constant.ts`) has no other user and is removed.

## Acceptance

- No static import of `@electric-sql/pglite` or a contrib extension remains in `packages/data/database/src/testing`
  outside type imports.
- The existing `check-migrations.function.test.ts` passes unchanged.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/database (testing entry only)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no; it follows ADR 0269 decision 3 and STA-1812
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1

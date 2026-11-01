/**
 * Stackra file contract:
 * Purpose: `PGLITE_EXTENSIONS`, the approved extensions the testing tier loads into PGlite, by the name `create
 *          extension` takes: all of ADR 0160's (PostGIS, ADR 0314, is not loaded yet). The memory driver and
 *          `checkMigrations` share it.
 * Boundary: the testing entry only (ADR 0269 decision 3); pgvector comes from `@electric-sql/pglite-pgvector`.
 * Runtime: node
 * Governing contract: ADR 0160 (decision 2: the approved extensions); ADR 0269 (decision 3); STA-1689.
 */
import { citext } from "@electric-sql/pglite/contrib/citext";
import { ltree } from "@electric-sql/pglite/contrib/ltree";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { vector } from "@electric-sql/pglite-pgvector";

/** The approved extensions, by extension name. */
export const PGLITE_EXTENSIONS = { vector, ltree, pg_trgm, citext, pgcrypto } as const;

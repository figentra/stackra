/**
 * Stackra file contract:
 * Purpose: `createExtensionsScript(extensions)`, the POSIX shell script a deploy's one-shot task runs with the
 *          server's admin login before any migration: it lists every database that accepts connections (`template1`,
 *          `postgres` and each service database; never `template0` or the cloud's own `rdsadmin` and
 *          `cloudsqladmin`) and runs `CREATE EXTENSION IF NOT EXISTS` for each planned extension in each one. A
 *          database created later from `template1` starts with them already.
 * Boundary: pure; names in, script text out. Idempotent, so a deploy may run it on every release. The login comes
 *           from the libpq variables of the task (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGSSLMODE`), injected
 *           from the cloud's secret store, so no value is in the script and none is printed. Only approved names are
 *           accepted, so nothing a runway says reaches the SQL or the shell unchecked. `psql` stops at the first
 *           error (`ON_ERROR_STOP`) and the script exits non-zero, which fails the deploy step that ran it.
 * Runtime: isomorphic
 * Governing contract: ADR 0160 (decision 2, notes of 2026-11-03 and 2026-11-26: infra pre-creates the extensions with
 *                     the admin login before migrations), ADR 0173 (no secret values).
 */
import { APPROVED_POSTGRES_EXTENSIONS } from "#core/constants/approved-postgres-extensions.constant";
import type { PostgresExtension } from "#core/enums/postgres-extension.enum";

/** The databases the script reaches: every one that takes connections, less the clouds' own. */
const DATABASES_SQL =
  "SELECT datname FROM pg_database WHERE datallowconn AND datname NOT IN ('rdsadmin', 'cloudsqladmin') ORDER BY datname";

/**
 * The idempotent script that creates `extensions` in every database of the server.
 *
 * @throws TypeError when the list is empty or names an extension outside `PostgresExtension` (ADR 0160).
 * @example
 * createExtensionsScript(["pg_trgm", "vector"]); // "set -eu\ndatabases=$(psql …)\n…"
 */
export function createExtensionsScript(extensions: readonly PostgresExtension[]): string {
  if (extensions.length === 0) throw new TypeError("Name at least one extension to create");
  const unapproved = extensions.filter(
    (extension) => !(APPROVED_POSTGRES_EXTENSIONS as readonly string[]).includes(extension),
  );
  if (unapproved.length > 0)
    throw new TypeError(
      `Not an approved Postgres extension (ADR 0160): ${unapproved.join(", ")}; expected one of ${APPROVED_POSTGRES_EXTENSIONS.join(", ")}`,
    );
  const statements = [...new Set(extensions)].map(
    (extension) => `CREATE EXTENSION IF NOT EXISTS "${extension}";`,
  );
  return [
    "set -eu",
    `databases=$(psql -X -v ON_ERROR_STOP=1 -At -d postgres -c "${DATABASES_SQL}")`,
    "printf '%s\\n' \"$databases\" | while IFS= read -r database; do",
    '  echo "create extensions in $database"',
    "  psql -X -q -v ON_ERROR_STOP=1 -d \"$database\" <<'SQL'",
    // An extension already there is the usual case on a rerun: no NOTICE line per database for it.
    "SET client_min_messages = warning;",
    ...statements,
    "SQL",
    "done",
  ].join("\n");
}

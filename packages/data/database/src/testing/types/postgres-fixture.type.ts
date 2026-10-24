/**
 * Stackra file contract:
 * Purpose: `PostgresFixture`, what `usePostgres()` returns: the container's connection string and the connected
 *          database, readable once the file's `beforeAll` has run.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { Database } from "#core/ports/database.port";

/** The running Postgres of one test file. */
export interface PostgresFixture {
  /** The connection string of the container's database. */
  readonly url: string;

  /** The connected database, which is also `Database.current()`. */
  readonly database: Database;
}

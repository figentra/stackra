/**
 * Stackra file contract:
 * Purpose: the first migration of the locking package (`locking.0001_create_lock_tokens`): the `locking.lock_tokens`
 *          sequence the Postgres driver draws each lease's fencing token from.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and the statement is a
 *           literal. A sequence is not transactional, so a token is never given twice, even by a rolled-back
 *           transaction. It lives in the package's own schema (`locking`), which gen creates first. No table: the
 *           locks themselves are advisory and live in Postgres memory.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0149 (decision 3: fencing tokens).
 */
import { Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the token sequence. */
export class CreateLockTokensMigration extends Migration {
  /** The sequence, with its inverse. */
  up(schema: SchemaBuilder): void {
    schema.sql("create sequence locking.lock_tokens as bigint", {
      inverse: "drop sequence if exists locking.lock_tokens",
    });
  }
}

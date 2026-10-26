/**
 * Stackra file contract:
 * Purpose: the first migration of the locking package (`locking.0001_create_lock_tokens`): the `locking.lock_tokens`
 *          table, one row per lock key, which the Postgres driver writes on each lease so the lease's fencing token
 *          (the WAL insert position after that write) is larger than every earlier lease's on the key.
 * Boundary: a frozen snapshot from here on: it imports only @stackra/database and every name is a literal. It lives in the package's own schema
 *           (`locking`), which gen creates first. No Postgres sequence (ADR 0394 d3) and no counter: the row holds no
 *           number, it only makes each lease write WAL after its lock is taken. No row-level-security policy: a lock
 *           key is not tenant data. Rewritten before any release, since the compiler now refuses the sequence the
 *           first version created. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0149 (decision 3: fencing tokens); ADR 0394 (decision 3); R-16.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the lock key table. */
export class CreateLockTokensMigration extends Migration {
  /** The table, keyed by the lock key. */
  up(schema: SchemaBuilder): void {
    schema.create("lock_tokens", (t: Blueprint) => {
      t.string("lock_key").notNull().comment("A lock key a lease was taken on.");
      t.timestamp("leased_at")
        .notNull()
        .comment("The start of the transaction that last leased the key.");
      t.primary(["lock_key"]);
    });
  }
}

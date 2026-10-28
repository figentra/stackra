/**
 * Stackra file contract:
 * Purpose: the third migration of the access-log package: revokes `UPDATE` on `access_log.access_log_entries` and
 *          `access_log.audit_log_entries`, the tables of the two `AppendOnly` models, through `t.appendOnly()`.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. It adds a grant layer under the `refuse_update()` triggers of migrations 0001 and 0002, which stay:
 *           the revoke binds the service's own role, the trigger every role. Inserts, reads and deletes (the retention
 *           purge, erasure) are untouched. No `down()`: gen derives the dev inverse (grant `UPDATE` back); production is
 *           forward only.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: snapshots); ADR 0212 (decision 3: append-only storage); STA-1413
 *                     (`t.appendOnly()`, gen's `append_only_not_revoked`).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Revokes `UPDATE` on both log tables. */
export class AppendOnlyLogEntriesMigration extends Migration {
  /** One revoke per append-only table. */
  up(schema: SchemaBuilder): void {
    schema.table("access_log_entries", (t: Blueprint) => {
      t.appendOnly();
    });
    schema.table("audit_log_entries", (t: Blueprint) => {
      t.appendOnly();
    });
  }
}

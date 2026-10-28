/**
 * Stackra file contract:
 * Purpose: revokes `UPDATE` on `loyalty_kit.ledger_entries`, the table of the `AppendOnly` model `LedgerEntry`, through
 *          `t.appendOnly()`.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and names the table with a
 *           literal. A correction is a new entry, never a changed one. Inserts, reads and deletes (retention, erasure)
 *           are untouched; the accounts table keeps `UPDATE`. No `down()`: gen derives the dev inverse (grant `UPDATE`
 *           back); production is forward only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 13); ADR 0159 (as amended: snapshots); STA-1413 (`t.appendOnly()`, gen's
 *                     `append_only_not_revoked`).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** No session of the service can change a ledger entry. */
export class AppendOnlyLedgerEntriesMigration extends Migration {
  /** One revoke. */
  up(schema: SchemaBuilder): void {
    schema.table("ledger_entries", (t: Blueprint) => {
      t.appendOnly();
    });
  }
}

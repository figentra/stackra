/**
 * Stackra file contract:
 * Purpose: `BackfillOptions`, what `Backfill({ ... })` states: its key, the table it walks and the keyset column, which
 *          rows it still has to reach, the SQL that fills them (or the class's `apply`), and its batch size and pause.
 * Boundary: a type only; `Backfill` checks each value when the class is declared. Every SQL part is a literal over the
 *           table's own columns, one line, never built from input.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs); ADR 0334 (rule 4: a data change is a seeder
 *                     or a backfill job, never a migration).
 */

/** A backfill's declaration. */
export interface BackfillOptions {
  /**
   * The backfill's key, `<module>.<snake name>` (`orders.fill_totals`): its ledger row, and the name a contract step's
   * `schema.requireBackfill(key, ...)` refuses with while rows remain.
   */
  readonly key: string;

  /** The table it walks, schema-qualified: `orders.orders`. */
  readonly table: string;

  /** The keyset column: unique, never null, and stable while the backfill runs; `id` by default. */
  readonly by?: string;

  /**
   * SQL over the table's columns, true for a row still to fill (`total_minor is null`). A batch takes the next rows
   * meeting it; the contract step's `requireBackfill` gate takes the same predicate.
   */
  readonly pending: string;

  /**
   * SQL assignments for a backfill that needs no code (`total_minor = subtotal_minor + tax_minor`), run per batch over
   * its rows. Without it, the class's `apply(batch)` fills each batch.
   */
  readonly set?: string;

  /** Rows per batch, each its own transaction: 1 to 10 000, 500 by default. */
  readonly batch?: number;

  /** Milliseconds to wait between batches, so a large backfill leaves room for live traffic: 0 to 60 000, 0 by default. */
  readonly pause?: number;
}

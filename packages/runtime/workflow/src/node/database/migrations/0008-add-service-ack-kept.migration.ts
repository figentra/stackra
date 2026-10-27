/**
 * Stackra file contract:
 * Purpose: the eighth migration of the workflow package: `workflow.service_ack_sets.kept`, what each service that
 *          acked a subject kept instead of disposing of it.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Existing sets take `{}` (nothing kept). No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0210 (decision 6); ADR 0189 (erasure acks); STA-1312; ADR 0159 (as amended); R-16 (every
 *                     column has a comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds what each service kept to the ack sets. */
export class AddServiceAckKeptMigration extends Migration {
  /** One jsonb column, defaulted so existing rows need no backfill. */
  up(schema: SchemaBuilder): void {
    schema.table("service_ack_sets", (t: Blueprint) => {
      t.jsonb("kept")
        .notNull()
        .default({})
        .comment(
          "What each service that acked kept, by member key: record kinds, reasons and counts.",
        );
    });
  }
}

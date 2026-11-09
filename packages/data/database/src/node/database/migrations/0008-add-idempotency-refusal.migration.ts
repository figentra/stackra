/**
 * Stackra file contract:
 * Purpose: the eighth migration of the database package (`database.0008_add_idempotency_refusal`): the expand step that
 *          gives `idempotency_keys` a nullable `refusal` column, where a call that ended in a refusal no retry can
 *          change keeps that refusal to replay.
 * Boundary: a frozen snapshot, never edited once on main: it imports only this package's own migration API and every
 *           name is a literal. One nullable column with no default, so no table rewrite; older rows stay null. No
 *           `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0136 (decision 3); ADR 0159 (as amended: expand and contract); STA-2532.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the stored refusal to the idempotency keys. */
export class AddIdempotencyRefusalMigration extends Migration {
  /** One nullable jsonb column. */
  up(schema: SchemaBuilder): void {
    schema.table("idempotency_keys", (t: Blueprint) => {
      t.jsonb("refusal")
        .nullable()
        .comment(
          "The refusal that ended the first call, replayed to every later call; null otherwise.",
        );
    });
  }
}

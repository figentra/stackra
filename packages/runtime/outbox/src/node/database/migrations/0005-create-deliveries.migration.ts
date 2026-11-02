/**
 * Stackra file contract:
 * Purpose: the fifth migration of the outbox package (`outbox.0005_create_deliveries`): the `outbox.deliveries` table
 *          the cross-app relay fills, one row per event, subscriber and wire name, with the indexes its fair scan, its
 *          operator listing and its once-only write read.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. It lives in the package's own schema (`outbox`). The table is the producer's operational table,
 *           read by the relay across scopes, so it has no row-level-security policy (as `outbox.messages`). The
 *           envelope is stored as sent, without `producer`; `last_error` holds a code and message, never a body. No
 *           `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0511 (decisions 12 and 13); ADR 0078 (decision 4); R-16 (every
 *                     column has a comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the delivery table. */
export class CreateDeliveriesMigration extends Migration {
  /** The table with its unique key and indexes. */
  up(schema: SchemaBuilder): void {
    schema.create("deliveries", (t: Blueprint) => {
      t.hasPublicId("dlv");
      t.string("event_id", 64).notNull().comment("The id of the event this delivery carries.");
      t.string("subscriber", 100).notNull().comment("The consuming member's key.");
      t.string("type", 255).notNull().comment("The event's wire name, with its version.");
      t.jsonb("envelope").notNull().comment("The cross-app envelope as sent, without `producer`.");
      t.integer("attempts").notNull().default(0).comment("Deliveries tried so far.");
      t.timestamp("available_at").notNull().comment("When the delivery is next due.");
      t.jsonb("last_error").nullable().comment("The code and message of the last failed attempt.");
      t.timestamp("dead_at")
        .nullable()
        .comment("When the delivery was dead-lettered after its last attempt.");
      t.timestamp("created_at").notNull().comment("When the delivery was written.");
      t.unique(["event_id", "subscriber", "type"]);
      t.index(["available_at"]).where("dead_at is null");
      t.index(["subscriber", "available_at"]);
    });
  }
}

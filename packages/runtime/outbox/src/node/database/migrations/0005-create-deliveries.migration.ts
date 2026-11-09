/**
 * Stackra file contract:
 * Purpose: the fifth migration of the outbox package (`outbox.0005_create_deliveries`): the `outbox.deliveries` table of
 *          the producer's cross-app deliveries (one per event version and subscriber), unique on (event id, subscriber,
 *          type), with the index the cross-app relay's scan reads.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. The table is the producer service's own operational table, read by the relay across scopes, so it
 *           has no row-level-security policy, as `outbox.messages`. A delivered row is deleted. No `down()`: gen derives
 *           the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0511 (decisions 12 and 13, amendment of 2026-11-02); ADR 0078
 *                     (decision 4); R-16 (every column has a comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the delivery table. */
export class CreateDeliveriesMigration extends Migration {
  /** The table with its unique key and index. */
  up(schema: SchemaBuilder): void {
    schema.create("deliveries", (t: Blueprint) => {
      t.hasPublicId("dlv");
      t.string("event_id", 64).notNull().comment("The id of the event this delivery carries.");
      t.string("subscriber", 255)
        .notNull()
        .comment("The member key of the consumer in another app it goes to.");
      t.string("type", 255).notNull().comment("The event's versioned wire name.");
      t.jsonb("envelope").notNull().comment("The cross-app envelope as sent, without producer.");
      t.integer("attempts").notNull().default(0).comment("Attempts tried so far.");
      t.timestamp("available_at").notNull().comment("When the delivery is next due.");
      t.jsonb("last_error")
        .nullable()
        .comment("The code and HTTP status of the last failed attempt, never a body.");
      t.timestamp("dead_at")
        .nullable()
        .comment("When the delivery was dead-lettered; replay clears it.");
      t.timestamp("created_at").notNull().comment("When the delivery was written.");
      t.unique(["event_id", "subscriber", "type"]);
      t.index(["available_at"]).where("dead_at is null");
    });
  }
}

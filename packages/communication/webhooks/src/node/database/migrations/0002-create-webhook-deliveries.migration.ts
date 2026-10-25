/**
 * Stackra file contract:
 * Purpose: the second migration of the webhooks package (`webhooks.0002_create_webhook_deliveries`): the delivery log
 *          `webhooks.webhook_deliveries`, one row per attempt, tied to its endpoint and indexed by event.
 * Boundary: a frozen snapshot of `webhooks.webhook_delivery`, never edited once on main: it imports only
 *           @stackra/database and every name is a literal. Deleting an endpoint deletes its log. No row-level-security
 *           policy, as on the endpoint table: an attempt is written in its own transaction by the delivery job, and
 *           the scope is data (an open item for the owner's data review). No body, header or secret column. No
 *           `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0224 (decision 3); ADR 0327 (decisions 3 and 9); ADR 0159 (as amended); R-16 (every column
 *                     has a comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the delivery log. */
export class CreateWebhookDeliveriesMigration extends Migration {
  /** The table with its foreign key and indexes. */
  up(schema: SchemaBuilder): void {
    schema.create("webhook_deliveries", (t: Blueprint) => {
      t.hasPublicId("whd");
      t.timestamps();
      t.belongsTo("webhook_endpoints", { column: "endpoint_id" })
        .notNull()
        .cascadeOnDelete()
        .comment("The endpoint the attempt was sent to.");
      t.scopeId().notNull().comment("The endpoint's scope node.");
      t.scopePath()
        .notNull()
        .comment("That node's path, denormalised for a subtree's delivery list.");
      t.string("event_id", 64)
        .notNull()
        .comment("The event's id, sent as webhook-id: the receiver's dedup key.");
      t.string("event_type", 200).notNull().comment("The event's wire name.");
      t.integer("response_status")
        .nullable()
        .comment("The endpoint's HTTP status; null when it did not answer.");
      t.boolean("is_delivered").notNull().comment("Whether the endpoint answered with a 2xx.");
      t.index(["event_id"]);
    });
  }
}

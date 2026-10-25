/**
 * Stackra file contract:
 * Purpose: the first migration of the outbox package (`outbox.0001_create_messages`): the `ltree` extension and the
 *          `outbox.messages` table the writers fill in the producer's transaction and the relay drains, with the index
 *          the relay's scan reads.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. It lives in the package's own schema (`outbox`), which gen creates first. The table is the
 *           service's outbox, read by the relay across scopes, so it has no row-level-security policy (data review: the
 *           relay must see every scope's messages); a message's scope is data (`scope_id`, `scope_path`) that the relay
 *           opens as the session of each delivery. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0078 (decision 4); ADR 0160 (approved extensions); ADR 0327
 *                     (decisions 3 and 9); R-16 (every column has a comment and its nullability).
 */
import { type Blueprint, Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the message table. */
export class CreateMessagesMigration extends Migration {
  /** The extension, then the table with its index. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("messages", (t: Blueprint) => {
      t.hasPublicId("evt");
      t.enum("kind", ["event", "change"])
        .notNull()
        .comment("An integration event or a watched row change.");
      t.string("type", 255)
        .notNull()
        .comment("The event's wire name, or the changed model's class name.");
      t.jsonb("data").notNull().comment("The event's fields, or the row change, as JSON.");
      t.jsonb("meta")
        .notNull()
        .default({})
        .comment("Who caused it, and the ids that chain it to its call and cause.");
      t.timestamp("occurred_at").notNull().comment("When the fact happened.");
      t.scopeId().nullable().comment("The scope node of the transaction that wrote the message.");
      t.scopePath().nullable().comment("That node's path, from the transaction's scope settings.");
      t.integer("attempts").notNull().default(0).comment("Deliveries tried so far.");
      t.timestamp("available_at").notNull().comment("When the message is next due.");
      t.jsonb("last_error").nullable().comment("The code and message of the last failed delivery.");
      t.timestamp("dead_at")
        .nullable()
        .comment("When the message was dead-lettered after its last attempt.");
      t.index(["available_at"]).where("dead_at is null");
    });
  }
}

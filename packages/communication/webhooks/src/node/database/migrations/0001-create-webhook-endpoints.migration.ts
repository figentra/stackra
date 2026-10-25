/**
 * Stackra file contract:
 * Purpose: the first migration of the webhooks package (`webhooks.0001_create_webhook_endpoints`): the
 *          `webhooks.webhook_endpoints` table of the receivers a scope registers, with the `ltree` extension and the
 *          path's GiST index.
 * Boundary: a frozen snapshot of `webhooks.webhook_endpoint`, never edited once on main: it imports only
 *           @stackra/database and every name is a literal. No row-level-security policy: the delivery listener reads
 *           the endpoints of an event's scope node outside any scope session, so the scope is data (`scope_id`,
 *           `scope_path`) that `WebhookEndpointService` filters on and the delivery job opens as its session (an open
 *           item for the owner's data review). Secret columns hold names, never values. No `down()`: gen derives the
 *           dev inverse.
 * Runtime: node
 * Governing contract: ADR 0224 (decisions 1 to 3); ADR 0308 (rule 17); ADR 0327 (decisions 3 and 9); ADR 0159 (as
 *                     amended); ADR 0160 (approved extensions); R-16 (every column has a comment and its nullability).
 */
import { type Blueprint, Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the endpoint table. */
export class CreateWebhookEndpointsMigration extends Migration {
  /** The extension, then the table with its indexes. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("webhook_endpoints", (t: Blueprint) => {
      t.hasPublicId("whe");
      t.timestamps();
      t.scopeId().notNull().comment("The scope node whose events the endpoint receives.");
      t.scopePath()
        .notNull()
        .comment("That node's path, denormalised for the delivery job's scope session.");
      t.string("url", 2048).notNull().comment("The receiver's https URL.");
      t.jsonb("events")
        .notNull()
        .default([])
        .comment("The wire names of the integration events it subscribes to.");
      t.string("secret_name", 255)
        .notNull()
        .comment("The name of the signing secret in the secret store; never its value.");
      t.string("previous_secret_name", 255)
        .nullable()
        .comment(
          "The name of the secret the last rotation replaced, still signed with for 24 hours.",
        );
      t.timestamp("rotated_at").nullable().comment("When the signing secret was last rotated.");
      t.timestamp("disabled_at")
        .nullable()
        .comment("When delivery stopped after a dead-lettered delivery; null while enabled.");
    });
  }
}

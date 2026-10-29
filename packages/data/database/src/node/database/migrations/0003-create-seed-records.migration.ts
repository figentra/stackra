/**
 * Stackra file contract:
 * Purpose: the third migration of the database package (`database.0003_create_seed_records`): the seed ledger behind
 *          `seedState` and `applySeed`, one row per record of a product's seed pack, holding the product-default
 *          content the pack wrote, the content hash and pack version it came from, and who owns the current value.
 * Boundary: a frozen snapshot, never edited once on main: it imports only this package's own migration API and every
 *           name is a literal. Product defaults are not tenant-owned, so there is no scope column and no policy; a
 *           tenant's own values live in the owning package's tenant layer and are never written here. `owner` turns to
 *           `tenant` when the owning package records an edit of the product default, and a seed run then keeps it.
 *           Rows are configuration, never personal data. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0396 (decision 1); ADR 0325 (decision 7: seeds are resumable); ADR 0190 (decision 1:
 *                     profiles); config-model section 6.
 */
import { Migration, type Blueprint, type SchemaBuilder } from "@stackra/database";

/** Creates the seed ledger. */
export class CreateSeedRecordsMigration extends Migration {
  /** One table keyed by pack, record kind and record key. */
  up(schema: SchemaBuilder): void {
    schema.create("seed_records", (t: Blueprint) => {
      t.timestamps();
      t.string("pack", 127).notNull().comment("The seed pack's key (seed-pack:<product>).");
      t.string("kind", 63)
        .notNull()
        .comment("The record kind, one of the CLI's seed record kinds.");
      t.string("key", 255).notNull().comment("The record key the owning package reads it by.");
      t.string("profile", 31)
        .notNull()
        .comment("The profile that last wrote it (minimal, demo, test).");
      t.string("version", 63).notNull().comment("The pack version that last wrote it.");
      t.string("hash", 64).notNull().comment("The SHA-256 of the seeded kind, key and rows.");
      t.enum("owner", ["seed", "tenant"])
        .notNull()
        .default("seed")
        .comment(
          "seed while the value is the pack's; tenant once someone changed it, so seeds keep it.",
        );
      t.jsonb("rows").notNull().comment("The seeded rows, each with its id and owner answer.");
      t.primary(["pack", "kind", "key"]);
    });
  }
}

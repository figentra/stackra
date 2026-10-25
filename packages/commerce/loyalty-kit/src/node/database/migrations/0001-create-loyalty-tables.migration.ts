/**
 * Stackra file contract:
 * Purpose: the kit's first tables, `loyalty_kit.loyalty_accounts` and `loyalty_kit.ledger_entries`, with the search
 *          columns of the account's `@Searchable` facet.
 * Boundary: a frozen snapshot of `loyalty_kit.loyalty_account` and `loyalty_kit.ledger_entry`, never edited once on
 *           main: it imports only @stackra/database and every name is a literal. Every column states its nullability
 *           and a comment equal to the model field's docblock. Partner macros write the conventions: the traits'
 *           (`hasPublicId`, `timestamps`, `versioned`, `softDeletes`), `belongsToTenant` (@stackra/tenancy: the scope
 *           column, its index and the forced equality policy) and `searchable` (@stackra/search: the search columns).
 *           Indexes on tables created here build inside the transaction. The entries' account column is nullable
 *           (expand); its index is 0002, built online. No `down()`: gen derives the dev inverse; production is forward
 *           only.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 13 and 20); ADR 0159 (as amended: snapshots, partner macros, comments and
 *                     nullability); ADR 0221; ADR 0239; ADR 0231 (index and key names).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Two tables; the unique indexes make enrolment and appends idempotent. */
export class CreateLoyaltyTablesMigration extends Migration {
  /** Creates the accounts (one live account per scope and principal) and the ledger entries. */
  up(schema: SchemaBuilder): void {
    schema.create("loyalty_accounts", (t: Blueprint) => {
      t.hasPublicId("lac");
      t.belongsToTenant();
      t.timestamps();
      t.versioned();
      t.softDeletes();
      t.string("member_id", 64)
        .notNull()
        .comment(
          "The host principal's public id; unique per scope among live accounts; pseudonymous.",
        );
      t.enum("tier", ["bronze", "silver", "gold"])
        .notNull()
        .default("bronze")
        .comment(
          "Current tier; raised by RecalculateTierListener after an earn, chosen only at enrolment.",
        );
      t.boolean("is_frozen")
        .notNull()
        .default(false)
        .comment("Frozen accounts earn and redeem nothing until staff unfreeze them.");
      t.timestamp("frozen_at")
        .nullable()
        .comment("When the account was frozen; null while active.");
      t.jsonb("notes").notNull().default({}).comment("Merchant notes; jsonb.");
      t.searchable({ text: ["member_id"], filters: ["tier", "is_frozen", "created_at"] });
      t.index(["search_vector"]).using("gin");
      t.index(["tenant_id", "tier"]);
      t.index(["tenant_id", "is_frozen"]);
      t.index(["tenant_id", "created_at"]);
      t.unique(["tenant_id", "member_id"]).where("deleted_at is null");
    });
    schema.create("ledger_entries", (t: Blueprint) => {
      t.hasPublicId("lpe");
      t.belongsToTenant();
      t.belongsTo("loyalty_accounts", { column: "account_id" })
        .nullable()
        .withoutIndex()
        .comment("The owning account; null until the backfill job fills it (expand step).");
      t.string("member_id", 64)
        .notNull()
        .comment(
          "The principal the points belong to; denormalised from the account for the unique index.",
        );
      t.integer("points")
        .notNull()
        .comment(
          "Points moved: positive earns, negative redeems; bounded by MAX_POINTS_PER_ENTRY either way.",
        );
      t.enum("kind", ["earn", "redeem", "expire", "adjust", "hold", "release"])
        .notNull()
        .comment("Why the row exists.");
      t.string("reference", 120)
        .notNull()
        .comment("The cause (an order id, a campaign id); unique per scope and member.");
      t.timestamp("at").notNull().comment("When the cause happened, as the caller reported it.");
      t.unique(["tenant_id", "member_id", "reference"]);
    });
  }
}

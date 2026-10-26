/**
 * Stackra file contract:
 * Purpose: the second migration of the rules package: `rules.rule_sets` gains the template key and seed version of a
 *          rule set seeded from a rule-set pack, with one seeded copy per template, consumer and scope.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Both columns are null for a tenant's own rule set, so existing rows need no backfill. No `down()`:
 *           gen derives the dev inverse.
 * Runtime: node
 * Governing contract: config-model section 6 (seed packs; a new seed version never overwrites tenant values); ADR 0331
 *                     (decision 5); ADR 0159 (as amended); R-16 (every column has a comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the seed columns. */
export class AddRuleSetSeedsMigration extends Migration {
  /** Two nullable columns and the unique seeded copy. */
  up(schema: SchemaBuilder): void {
    schema.table("rule_sets", (t: Blueprint) => {
      t.string("seed_key", 255)
        .nullable()
        .comment(
          "The rule-set pack template the rule set was seeded from; null for a tenant's own.",
        );
      t.string("seed_version", 31)
        .nullable()
        .comment("The pack version of the last seeded revision; null for a tenant's own.");
      t.unique(["scope_id", "consumer", "seed_key"]).where("seed_key is not null").concurrently();
    });
  }
}

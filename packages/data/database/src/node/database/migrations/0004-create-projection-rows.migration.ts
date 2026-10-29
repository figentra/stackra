/**
 * Stackra file contract:
 * Purpose: the fourth migration of the database package (`database.0004_create_projection_rows`): the versions table
 *          behind `Projection<Source>({ key })`. One row per version of a projected record: the projection key, the
 *          scope, the record id, the stored JSON and the span it was in effect (`valid_to` null while current), so a
 *          read model answers now and `asOf` a past moment.
 * Boundary: a frozen snapshot, never edited once on main: it imports only this package's own migration API and every
 *           name is a literal. It lives in the package's own schema (`database`). The table carries the scope columns
 *           and the forced ancestor policy on `app.scope_paths`, so a session reads and writes only its granted
 *           scopes. A record has at most one current version (the partial unique index). No `down()`: gen derives the
 *           dev inverse.
 * Runtime: node
 * Governing contract: ADR 0163 (decision 1: read models with `asOf`); ADR 0294 (decision 16); ADR 0159 (as amended);
 *                     ADR 0327 (decisions 3 and 9); `.agents/rules/tenancy.md` (point 3).
 */
import { Migration, type Blueprint, type SchemaBuilder } from "@stackra/database";

/** Creates the projection versions table. */
export class CreateProjectionRowsMigration extends Migration {
  /** One table keyed by projection, scope, record and the start of the version. */
  up(schema: SchemaBuilder): void {
    schema.create("projection_rows", (t: Blueprint) => {
      t.string("projection_key", 127)
        .notNull()
        .comment("The projection's written key, from Projection({ key }).");
      t.scopeId().notNull().comment("The scope node the record belongs to.");
      t.scopePath().notNull().comment("That node's path, denormalised for the policy.");
      t.string("record_id", 255)
        .notNull()
        .comment("The projected record's id, usually the source record's public id.");
      t.jsonb("data")
        .notNull()
        .comment("The stored row, as the projection's type argument shapes it.");
      t.timestamp("valid_from")
        .notNull()
        .comment("When this version took effect: the time of the event that wrote it.");
      t.timestamp("valid_to")
        .nullable()
        .comment("When the next version or the removal took effect; null while current.");
      t.primary(["projection_key", "scope_id", "record_id", "valid_from"]);
      t.unique(["projection_key", "scope_id", "record_id"]).where("valid_to is null");
      t.index(["projection_key", "record_id"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
  }
}

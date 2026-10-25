/**
 * Stackra file contract:
 * Purpose: the first table of the access-log package, `access_log.access_log_entries`, with its hash-chain columns and
 *          the trigger that keeps it append-only.
 * Boundary: a frozen snapshot of `access_log.access_log_entry`, never edited once on main: it imports only
 *           @stackra/database and every name is a literal. Every column states its nullability and a comment equal to
 *           the model field's docblock. Partner macros write the conventions: `belongsToTenant` (@stackra/tenancy: the
 *           tenant column, its index and the forced equality policy `pol_access_log_entries_tenant_id`) and this
 *           package's `dataClassification`. The unique (tenant, sequence) index keeps each tenant's chain linear. No
 *           blueprint operation states "no UPDATE", so the guard is raw SQL through `schema.sql` with its inverse,
 *           qualified by the package's own schema. No `down()`: gen derives the rest of the dev inverse, and
 *           production is forward only.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: snapshots, partner macros, comments and nullability, `schema.sql` with
 *                     `inverse`); ADR 0212 (decision 3: append-only storage, a hash chain per tenant); ADR 0239; ADR
 *                     0231 (index and constraint names); ADR 0294 (decisions 13 and 20).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the access record table. */
export class CreateAccessLogEntriesMigration extends Migration {
  /** The table with its policy and indexes, then the function and trigger that refuse an UPDATE. */
  up(schema: SchemaBuilder): void {
    schema.create("access_log_entries", (t: Blueprint) => {
      t.hasPublicId("acl");
      t.belongsToTenant();
      t.string("call_id", 64)
        .notNull()
        .comment("The id of the action or query call the access ran in.");
      t.string("target", 200).notNull().comment("The called method, as <Class>.<method>.");
      t.dataClassification("classification")
        .notNull()
        .comment("The data classification the class declared.");
      t.jsonb("actor").notNull().comment("The actor with its onBehalfOf chain, ids only.");
      t.jsonb("subjects")
        .notNull()
        .comment("The public ids of the people whose data the call touched.");
      t.timestamp("at").notNull().comment("When the access was recorded.").index();
      t.integer("sequence")
        .notNull()
        .comment("The record's position in its tenant's hash chain, from 1.");
      t.string("previous_hash", 64)
        .notNull()
        .comment("The hash of the record before it in the chain.");
      t.string("hash", 64)
        .notNull()
        .comment("SHA-256 of the previous hash, the sequence and the record.");
      t.unique(["tenant_id", "sequence"]);
      t.index(["tenant_id", "call_id"]);
      t.index(["tenant_id", "classification"]);
    });
    schema.sql(
      `create function "access_log"."refuse_update"() returns trigger language plpgsql as $$
begin
  raise exception 'access_log.access_log_entries is append-only';
end $$`,
      { inverse: 'drop function if exists "access_log"."refuse_update"()' },
    );
    schema.sql(
      'create trigger "trg_access_log_entries_refuse_update" before update on "access_log"."access_log_entries" ' +
        'for each row execute function "access_log"."refuse_update"()',
      {
        inverse:
          'drop trigger if exists "trg_access_log_entries_refuse_update" on "access_log"."access_log_entries"',
      },
    );
  }
}

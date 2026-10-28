/**
 * Stackra file contract:
 * Purpose: the write audit table of the access-log package, `access_log.audit_log_entries`, with its hash-chain columns
 *          and the trigger that keeps it append-only.
 * Boundary: a frozen snapshot of `access_log.audit_log_entry`, never edited once on main: it imports only
 *           @stackra/database and every name is a literal. Every column states its nullability and a comment equal to
 *           the model field's docblock. `belongsToTenant` (@stackra/tenancy) writes the tenant column, its index and the
 *           forced equality policy `pol_audit_log_entries_tenant_id`. The unique (tenant, sequence) index keeps each
 *           tenant's chain linear. The UPDATE guard reuses `access_log.refuse_update()` from migration 0001, through
 *           `schema.sql` with its inverse. No `down()`: gen derives the dev inverse, and production is forward only.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: snapshots, partner macros, comments and nullability, `schema.sql` with
 *                     `inverse`); ADR 0212 (decision 3: append-only storage, a hash chain per tenant); ADR 0239; ADR
 *                     0231 (index and constraint names); ADR 0465 (decision 4).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the write audit table. */
export class CreateAuditLogEntriesMigration extends Migration {
  /** The table with its policy and indexes, then the trigger that refuses an UPDATE. */
  up(schema: SchemaBuilder): void {
    schema.create("audit_log_entries", (t: Blueprint) => {
      t.hasPublicId("aud");
      t.belongsToTenant();
      t.string("call_id", 64).notNull().comment("The id of the audited action call.");
      t.string("key", 200).notNull().comment("The action's locked key.");
      t.string("permission", 200)
        .nullable()
        .comment("The derived permission, when gen registered one.");
      t.string("risk", 2).nullable().comment("The permission's risk, L0 to L4.");
      t.jsonb("effects").notNull().comment("The permission's effect tags.");
      t.jsonb("actor").notNull().comment("The actor with its onBehalfOf chain, ids only.");
      t.string("scope_id", 64).nullable().comment("The scope node the call acted in.");
      t.string("scope_path").nullable().comment("That scope node's path.");
      t.string("origin_kind", 32).nullable().comment("The surface the call arrived through.");
      t.string("origin_id", 64)
        .nullable()
        .comment("The public id of the storefront, API key or agent the call came from.");
      t.enum("outcome", ["ok", "refused"]).notNull().comment("ok, or refused.");
      t.string("code", 100).nullable().comment("The refusal code of a refused call.");
      t.jsonb("fields").notNull().comment("The fields the handler added with ctx.audit.");
      t.timestamp("at")
        .notNull()
        .comment("When the call started, from the pipeline clock.")
        .index();
      t.integer("sequence")
        .notNull()
        .comment("The record's position in its tenant's audit chain, from 1.");
      t.string("previous_hash", 64)
        .notNull()
        .comment("The hash of the record before it in the chain.");
      t.string("hash", 64)
        .notNull()
        .comment("SHA-256 of the previous hash, the sequence and the record.");
      t.unique(["tenant_id", "sequence"]);
      t.index(["tenant_id", "call_id"]);
      t.index(["tenant_id", "key"]);
    });
    schema.sql(
      'create trigger "trg_audit_log_entries_refuse_update" before update on "access_log"."audit_log_entries" ' +
        'for each row execute function "access_log"."refuse_update"()',
      {
        inverse:
          'drop trigger if exists "trg_audit_log_entries_refuse_update" on "access_log"."audit_log_entries"',
      },
    );
  }
}

/**
 * Stackra file contract:
 * Purpose: the second migration of the privacy package (`privacy.0002_create_legal_holds`): the hold store of a product
 *          outside Figentra OS. `privacy.legal_holds` keeps each hold on a record (or on a subject its records link
 *          to) from placement to release; `privacy.legal_hold_refusals` logs each disposal a hold refused.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Both tables are partitioned by the session's `app.tenant_id` (`-` outside a tenant) under a forced
 *           policy written with `schema.sql`, as `subject_salts` is, so a hold stays inside its tenant and a host
 *           without tenancy still works. A released hold keeps its row (release time, actor and reason), so the
 *           history is evidence. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: holds); ADR 0189 (decision 4); ADR 0159 (as amended); ADR 0239
 *                     (equality on the tenant setting); data-layer gap gov20 (stackra-332).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** The session's partition: its tenant, or `-` outside one. */
const PARTITION = "coalesce(nullif(current_setting('app.tenant_id', true), ''), '-')";

/** Creates the holds and refusals tables and their policies. */
export class CreateLegalHoldsMigration extends Migration {
  /** The two tables, then row-level security forced on each one's partition. */
  up(schema: SchemaBuilder): void {
    schema.create("legal_holds", (t: Blueprint) => {
      t.string("id", 63).notNull().comment("The hold's public id (lgh_).");
      t.string("scope_id", 63)
        .notNull()
        .comment(
          "The tenant the hold belongs to, from app.tenant_id; - for a session in no tenant.",
        );
      t.string("model", 127)
        .notNull()
        .comment("The entity name of the held record's model, as the hold registry is asked.");
      t.string("record_id", 255)
        .notNull()
        .comment(
          "The held record's id; a subject's public id also holds every record linked to it.",
        );
      t.string("reason", 1000)
        .notNull()
        .comment("Why the hold was placed (the matter, the request).");
      t.string("placed_by", 63)
        .nullable()
        .comment("The principal who placed it; null for a system call.");
      t.timestamp("placed_at").notNull().comment("When the hold was placed.");
      t.timestamp("released_at")
        .nullable()
        .comment("When the hold was released; null while it holds.");
      t.string("released_by", 63).nullable().comment("The principal who released it.");
      t.string("release_reason", 1000).nullable().comment("Why the hold was released.");
      t.primary(["id"]);
      t.index(["scope_id", "record_id"]).where("released_at is null");
    });
    schema.create("legal_hold_refusals", (t: Blueprint) => {
      t.string("scope_id", 63)
        .notNull()
        .comment("The tenant of the refused disposal, from app.tenant_id; - outside one.");
      t.string("model", 127).notNull().comment("The entity name of the record's model.");
      t.string("record_id", 255).notNull().comment("The record a hold kept.");
      t.string("disposal", 31).notNull().comment("How it would have been disposed of (Disposal).");
      t.timestamp("at").notNull().comment("When the disposal was refused.");
      t.index(["scope_id", "record_id"]);
    });
    for (const table of ["legal_holds", "legal_hold_refusals"]) {
      const qualified = `"privacy"."${table}"`;
      schema.sql(`alter table ${qualified} enable row level security`, {
        inverse: `alter table ${qualified} disable row level security`,
      });
      schema.sql(`alter table ${qualified} force row level security`, {
        inverse: `alter table ${qualified} no force row level security`,
      });
      schema.sql(
        `create policy "pol_${table}_scope_id" on ${qualified} ` +
          `using ("scope_id" = ${PARTITION}) with check ("scope_id" = ${PARTITION})`,
        { inverse: `drop policy if exists "pol_${table}_scope_id" on ${qualified}` },
      );
    }
  }
}

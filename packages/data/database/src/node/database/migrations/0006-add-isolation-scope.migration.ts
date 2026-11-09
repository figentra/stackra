/**
 * Stackra file contract:
 * Purpose: the sixth migration of the database package (`database.0006_add_isolation_scope`): the expand step that
 *          gives `sequence_counters`, `sequence_blocks`, `sequence_voids` and `projection_rows` the scope node of the
 *          call's isolation, `isolation_scope_id`, filled from `app.tenant_id`.
 * Boundary: a frozen snapshot, never edited once on main: it imports only this package's own migration API and every
 *           name is a literal. Each table keeps `scope_id` as it is, because it is a key column that may name a node
 *           below the isolation's (a sequence counts per scope node, a projection row is kept in its event's scope),
 *           so the isolation's node is a second column, named in scope words (ADR 0323): a public-id column, indexed
 *           online, nullable, filled by default from the call's setting, and no policy, so each table keeps its
 *           forced scope-path policy and no session reads a row more or less. Older rows stay null until a backfill
 *           sets them; the contract step (NOT NULL, equality with the setting as the one permissive policy, the scope
 *           path restrictive) follows. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0347 (decisions 1 and 2); ADR 0239 (decision 1); ADR 0323 (decision 1); ADR 0159 (as
 *                     amended: expand and contract); tenancy audit 2026-11-07, gap D.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** The column's comment, the same on each table. */
const COMMENT =
  "The scope node of the call's isolation (its app.tenant_id); null on an older row until backfilled.";

/** Adds the isolation's scope node to the sequence and projection tables. */
export class AddIsolationScopeMigration extends Migration {
  /** One nullable column per table, beside its scope-path policy. */
  up(schema: SchemaBuilder): void {
    schema.table("sequence_counters", (t: Blueprint) => {
      t.link("isolation_scope_id").nullable().defaultSetting("app.tenant_id").comment(COMMENT);
    });
    schema.table("sequence_blocks", (t: Blueprint) => {
      t.link("isolation_scope_id").nullable().defaultSetting("app.tenant_id").comment(COMMENT);
    });
    schema.table("sequence_voids", (t: Blueprint) => {
      t.link("isolation_scope_id").nullable().defaultSetting("app.tenant_id").comment(COMMENT);
    });
    schema.table("projection_rows", (t: Blueprint) => {
      t.link("isolation_scope_id").nullable().defaultSetting("app.tenant_id").comment(COMMENT);
    });
  }
}

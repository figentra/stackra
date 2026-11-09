/**
 * Stackra file contract:
 * Purpose: the second migration of the segments package (`segments.0002_add_segments_tenancy`): the expand step that gives
 *          `segments` and `segment_memberships` their owning tenant.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. `belongsToTenant({ expand: true })` (@stackra/tenancy) adds a nullable `tenant_id`, indexed online
 *           and filled from the call's `app.tenant_id` by default, and no policy: each table keeps its scope-path
 *           policy, so no session reads a row more or less. Older rows stay null until a backfill job sets them; the
 *           contract step (NOT NULL, the tenant equality as the one permissive policy and the scope path restrictive)
 *           follows in a later release. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0347 (decisions 1 and 2); ADR 0239 (decision 1); ADR 0159 (as amended: expand and
 *                     contract); tenancy audit 2026-11-07, gap D.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the tenant column to the scope-path tables. */
export class AddSegmentsTenancyMigration extends Migration {
  /** One nullable tenant column per table, beside its scope-path policy. */
  up(schema: SchemaBuilder): void {
    schema.table("segments", (t: Blueprint) => {
      t.belongsToTenant({ expand: true });
    });
    schema.table("segment_memberships", (t: Blueprint) => {
      t.belongsToTenant({ expand: true });
    });
  }
}

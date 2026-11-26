/**
 * Stackra file contract:
 * Purpose: the third migration of the scheduler package (`scheduler.0003_create_fires`): the `scheduler.fires` table,
 *          one row per run a tick pushed (its fire key and fire time), so a tick that pushes again after one that died
 *          before its watermark moved pushes no run twice, even when the first job has finished and left the queue.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Tenant-owned in the platform form from the start (ADR 0239 amendment, gap C): a fire takes the
 *           tenant of the owner transaction it is written in (`tenant_id` filled from `app.tenant_id`, NULL for a
 *           platform cron's), and is written, read and deleted only there, so it needs no system access. The primary
 *           key (fire key, fire time) is global across owners, an index rather than a read, as a fire key names one
 *           schedule, or one cron in one scope. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0148 (decision 5); ADR 0239 (2026-11-07 amendment, gap C, decision 5: the tick); ADR 0159
 *                     (as amended); R-16 (every column has a comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the fire table. */
export class CreateFiresMigration extends Migration {
  /** The table, its owner column and its platform-form policies. */
  up(schema: SchemaBuilder): void {
    schema.create("fires", (t: Blueprint) => {
      t.string("fire_key", 240)
        .notNull()
        .comment(
          "A stored schedule's id, a cron's job key, or a per-scope cron's job key and scope id.",
        );
      t.timestamp("fire_at").notNull().comment("The run's fire time.");
      t.link("tenant_id")
        .nullable()
        .defaultSetting("app.tenant_id")
        .comment(
          "The owning tenant, or NULL for a platform fire; filled from the call's tenant, never from input.",
        );
      t.primary(["fire_key", "fire_at"]);
      t.rowLevelSecurity("tenant_id", { setting: "app.tenant_id", match: "platform" });
    });
  }
}

/**
 * Stackra file contract:
 * Purpose: the first migration of the scheduler package (`scheduler.0001_create_schedules`): the `scheduler.schedules`
 *          table of per-scope schedules and the `scheduler.watermarks` table of the last tick that evaluated each cron
 *          and schedule, with the `ltree` extension the scope path needs.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. It lives in the package's own schema (`scheduler`), which gen creates first. Neither table has a
 *           row-level-security policy: one runner reads every scope's schedules each tick (as the queue's workers read
 *           every scope's jobs), so a scope's reads and deletes name the scope themselves (`scope_id = ?`). No
 *           `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0148 (decisions 4 and 5); ADR 0327 (decisions 3 and 9); ADR 0160
 *                     (approved extensions); R-16 (every column has a comment and its nullability).
 */
import { type Blueprint, Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the schedule and watermark tables. */
export class CreateSchedulesMigration extends Migration {
  /** The extension, then the two tables. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("schedules", (t: Blueprint) => {
      t.hasPublicId("sch");
      t.timestamps();
      t.scopeId().notNull().comment("The scope node every run is pushed with.");
      t.scopePath().notNull().comment("That node's materialised path, denormalised.");
      t.string("job_key", 200)
        .notNull()
        .comment("The locked key of the job action each run pushes.");
      t.string("cron", 120).notNull().comment("The five-field cron expression, read in time_zone.");
      t.string("time_zone", 64)
        .notNull()
        .default("UTC")
        .comment("The IANA time zone the cron is read in.");
      t.jsonb("input").notNull().default({}).comment("The input every run gets, as JSON.");
      t.enum("misfire", ["catch_up", "once", "skip"])
        .notNull()
        .comment("What a tick does with runs it missed.");
    });
    schema.create("watermarks", (t: Blueprint) => {
      t.string("schedule_key", 200)
        .notNull()
        .comment("A cron's job key or a stored schedule's public id.");
      t.timestamp("ticked_at").notNull().comment("The last tick that evaluated it.");
      t.primary(["schedule_key"]);
    });
  }
}

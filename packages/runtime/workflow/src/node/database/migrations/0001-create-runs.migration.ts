/**
 * Stackra file contract:
 * Purpose: the first migration of the workflow package (`workflow.0001_create_runs`): the `ltree` extension and the
 *          journal's three tables: `workflow.runs` (one row per run, with its scope), `workflow.steps` (one row per step
 *          a run reached) and `workflow.signals` (signals held until a run takes them), with the indexes the engine's
 *          lookups and the worker's scan read.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. It lives in the package's own schema (`workflow`), which gen creates first. The worker reads runs
 *           and signals across scopes (data review: it advances every scope's runs), so no table has a
 *           row-level-security policy; a run's scope is data (`scope_id`, `scope_path`) that the engine opens as the
 *           session of each step, and a signal is taken only by a run of its own scope. No `down()`: gen derives the
 *           dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0102 (decision 1: run, step, status, attempt); ADR 0160 (approved
 *                     extensions); ADR 0327 (decisions 3 and 9); R-16 (every column has a comment and its nullability).
 */
import { type Blueprint, Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the journal tables. */
export class CreateRunsMigration extends Migration {
  /** The extension, then the runs, their steps and the held signals. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("runs", (t: Blueprint) => {
      t.hasPublicId("wfr");
      t.string("workflow", 255)
        .notNull()
        .comment("The workflow's registered key, else its class name.");
      t.enum("status", ["running", "waiting", "completed", "compensating", "compensated", "failed"])
        .notNull()
        .comment("Where the run stands.");
      t.jsonb("input").notNull().comment("The input the run started with, as JSON.");
      t.jsonb("origin")
        .notNull()
        .comment(
          "The starting call: its id and key, the caller, and its locale, time zone, currency and market.",
        );
      t.jsonb("error")
        .nullable()
        .comment("The code and message the run compensated or failed with.");
      t.scopeId().nullable().comment("The scope node the run runs in.");
      t.scopePath().nullable().comment("That node's path.");
      t.timestamp("started_at").notNull().comment("When the run started.");
      t.timestamp("deadline_at").nullable().comment("When the run's timeout passes.");
      t.timestamp("ended_at").nullable().comment("When the run completed, compensated or failed.");
      t.index(["workflow", "started_at"]);
      t.index(["status"]).where("status in ('running', 'waiting', 'compensating')");
    });
    schema.create("steps", (t: Blueprint) => {
      t.belongsTo("runs", { column: "run_id" })
        .notNull()
        .cascadeOnDelete()
        .comment("The run the step belongs to.");
      t.string("name", 255).notNull().comment("The step's method name.");
      t.integer("position")
        .notNull()
        .comment("The order in which the run reached the step, from 0.");
      t.enum("status", [
        "running",
        "waiting",
        "done",
        "skipped",
        "failed",
        "timed_out",
        "compensated",
      ])
        .notNull()
        .comment("Where the step stands.");
      t.integer("attempts").notNull().default(0).comment("Attempts made so far.");
      t.jsonb("result").nullable().comment("The step's result once done, as JSON.");
      t.jsonb("error")
        .nullable()
        .comment("The code and message of its last failure, or of its undo's.");
      t.jsonb("progress").nullable().comment("What the step last reported through its heartbeat.");
      t.string("signal", 255).nullable().comment("The key of the signal a waiting step waits for.");
      t.string("correlation")
        .nullable()
        .comment("The correlation that signal must carry, in canonical form.");
      t.timestamp("wake_at").nullable().comment("When a waiting step's wait times out.");
      t.timestamp("started_at").notNull().comment("When the step first started or parked.");
      t.timestamp("ended_at").nullable().comment("When the step ended.");
      t.primary(["run_id", "name"]);
      t.index(["signal", "correlation"]).where("status = 'waiting'");
    });
    schema.create("signals", (t: Blueprint) => {
      t.hasPublicId("wfs");
      t.string("signal", 255)
        .notNull()
        .comment("The signal's registered key, else its class name.");
      t.string("correlation")
        .notNull()
        .comment("The correlation it was sent with, in canonical form.");
      t.jsonb("payload").notNull().comment("The signal's fields, as JSON.");
      t.scopeId().nullable().comment("The scope node of the call that sent it.");
      t.scopePath().nullable().comment("That node's path.");
      t.timestamp("received_at").notNull().comment("When the signal arrived.");
      t.timestamp("expires_at").notNull().comment("When an untaken signal is dropped.");
      t.index(["signal", "correlation", "received_at"]);
      t.index(["expires_at"]);
    });
  }
}

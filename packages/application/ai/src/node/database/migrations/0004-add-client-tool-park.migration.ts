/**
 * Stackra file contract:
 * Purpose: the fourth migration of the ai package (`ai.0004_add_client_tool_park`): the `waiting_client_tool` run
 *          status, the `client_tool` tool call outcome, and the three columns a run parked on a client tool call keeps:
 *          the surface it went to, the tool and when the wait ends.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Existing runs keep null columns. A client park shares `pending_tool_call_id` with an approval park.
 *           The status and outcome checks are replaced by raw SQL because a column's enum check has no blueprint change;
 *           the constraint names are migration 0001's (`ck_<table>_<column>`). The inverses restore the checks of
 *           0001 (they fail while a row holds the new value, which is the point). `tool_calls` stays append-only: only
 *           its check changes.
 * Runtime: node
 * Governing contract: ADR 0490 (decision 4: a client tool call parks the run); ADR 0159 (as amended); ADR 0160 (raw SQL
 *                     with a reason); ADR 0100 (decision 10); R-16 (every column has a comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the client tool park to runs and the client tool outcome to tool calls. */
export class AddClientToolParkMigration extends Migration {
  /** Three nullable columns, and the two widened checks. */
  up(schema: SchemaBuilder): void {
    schema.table("runs", (t: Blueprint) => {
      t.string("pending_surface_id", 64)
        .nullable()
        .comment(
          "The surface a parked client tool call went to; null unless waiting for a client tool.",
        );
      t.string("pending_tool", 160)
        .nullable()
        .comment("The client tool a parked call runs; null unless waiting for a client tool.");
      t.timestamp("pending_expires_at")
        .nullable()
        .comment(
          "When a parked client tool call stops waiting; null unless waiting for a client tool.",
        );
    });
    // raw-sql: a column's enum check has no blueprint change; the constraint names are migration 0001's
    schema.sql(
      'alter table "ai"."runs" drop constraint "ck_runs_status", add constraint "ck_runs_status" check ' +
        "(\"status\" in ('queued', 'running', 'waiting_approval', 'waiting_client_tool', 'completed', 'failed'))",
      {
        inverse:
          'alter table "ai"."runs" drop constraint "ck_runs_status", add constraint "ck_runs_status" check ' +
          "(\"status\" in ('queued', 'running', 'waiting_approval', 'completed', 'failed'))",
      },
    );
    // raw-sql: same reason as above
    schema.sql(
      'alter table "ai"."tool_calls" drop constraint "ck_tool_calls_outcome", add constraint "ck_tool_calls_outcome" check ' +
        "(\"outcome\" in ('ok', 'refused', 'approval_required', 'proposed', 'client_tool'))",
      {
        inverse:
          'alter table "ai"."tool_calls" drop constraint "ck_tool_calls_outcome", add constraint "ck_tool_calls_outcome" check ' +
          "(\"outcome\" in ('ok', 'refused', 'approval_required', 'proposed'))",
      },
    );
  }
}

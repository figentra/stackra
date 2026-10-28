/**
 * Stackra file contract:
 * Purpose: the third migration of the ai package (`ai.0003_append_only_ai_tables`): revokes `UPDATE` on `ai.messages`,
 *          `ai.steps` and `ai.tool_calls`, the tables of the `AppendOnly` models `Message`, `RunStep` and `ToolCall`,
 *          through `t.appendOnly()`.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Runs and approvals change state, so they keep `UPDATE`. Inserts, reads and deletes (retention,
 *           erasure) are untouched. No `down()`: gen derives the dev inverse (grant `UPDATE` back); production is forward
 *           only.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: snapshots); ADR 0100 (the ai tables); STA-1413 (`t.appendOnly()`, gen's
 *                     `append_only_not_revoked`).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Revokes `UPDATE` on the three append-only ai tables. */
export class AppendOnlyAiTablesMigration extends Migration {
  /** One revoke per append-only table. */
  up(schema: SchemaBuilder): void {
    schema.table("messages", (t: Blueprint) => {
      t.appendOnly();
    });
    schema.table("steps", (t: Blueprint) => {
      t.appendOnly();
    });
    schema.table("tool_calls", (t: Blueprint) => {
      t.appendOnly();
    });
  }
}

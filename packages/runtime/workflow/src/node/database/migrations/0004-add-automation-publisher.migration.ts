/**
 * Stackra file contract:
 * Purpose: the fourth migration of the workflow package: the publisher of each automation and its pause, so an
 *          automation whose publisher lost access stops starting runs.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Existing rows keep a null publisher, which `AutomationService` reads as the principal. No
 *           `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0153 (decision 2); ADR 0423 (decisions 1 and 2); ADR 0159 (as amended); R-16 (every column
 *                     has a comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the publisher and the pause. */
export class AddAutomationPublisherMigration extends Migration {
  /** Three nullable columns and the index of running automations. */
  up(schema: SchemaBuilder): void {
    schema.table("automations", (t: Blueprint) => {
      t.jsonb("publisher")
        .nullable()
        .comment(
          "Who published the revision in force: its kind and public id; null until published.",
        );
      t.timestamp("paused_at")
        .nullable()
        .comment("When the automation stopped starting runs; null while it runs.");
      t.string("pause_reason", 63)
        .nullable()
        .comment("Why it paused, a snake_case code; null while it runs.");
      t.index(["trigger"]).where("published_revision is not null and paused_at is null");
    });
  }
}

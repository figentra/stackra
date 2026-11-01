/**
 * Stackra file contract:
 * Purpose: the first migration of the consumer-gate scaffold fixture: the `gate_notes` table of `GateNote`.
 * Boundary: a frozen snapshot that uses only `@stackra/database`; every name is a literal.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0294 (the v3 shape).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the notes table. */
export class CreateGateNotesMigration extends Migration {
  /** The table. */
  up(schema: SchemaBuilder): void {
    schema.create("gate_notes", (t: Blueprint) => {
      t.hasPublicId("gnt");
      t.timestamps();
      t.string("text", 500).notNull().comment("The note's text.");
    });
  }
}

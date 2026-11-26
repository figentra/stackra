/**
 * Stackra file contract:
 * Purpose: `AddGateNoteOutput`, the output of `gate-example.note.add@1` in the consumer-gate scaffold fixture.
 * Boundary: a shape class in its own file; built with `AddGateNoteOutput.create`, never `new`.
 * Runtime: node
 * Governing contract: ADR 0294 (the v3 shape); ADR 0305 (one declaration per file); STA-2705.
 */
import { Schema } from "@stackra/validation";

/** The note that was added. */
export class AddGateNoteOutput extends Schema {
  /** The note's text. */
  text!: string;
}

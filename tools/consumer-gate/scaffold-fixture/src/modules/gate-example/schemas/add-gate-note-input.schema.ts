/**
 * Stackra file contract:
 * Purpose: `AddGateNoteInput`, the input of `gate-example.note.add@1` in the consumer-gate scaffold fixture.
 * Boundary: a shape class in its own file; built with `AddGateNoteInput.create`, never `new`.
 * Runtime: node
 * Governing contract: ADR 0294 (the v3 shape); ADR 0305 (one declaration per file); STA-2705.
 */
import { Schema, Str } from "@stackra/validation";

/** The note to add. */
export class AddGateNoteInput extends Schema {
  /** The note's text, 1 to 500 characters. */
  @Str({
    min: 1,
    max: 500,
  })
  text!: string;
}

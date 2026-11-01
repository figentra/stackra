/**
 * Stackra file contract:
 * Purpose: `GateNote`, the one model of the consumer-gate scaffold fixture: a note with a text.
 * Boundary: data only; the fixture the `scaffold` consumer copies into a scaffolded service (STA-1813).
 * Runtime: node
 * Governing contract: ADR 0294 (the v3 shape); ADR 0500 (decision 3).
 */
import { HasPublicId, Model, Timestamps } from "@stackra/model";
import { Str } from "@stackra/validation";

/** A note. */
export class GateNote extends Model.with(HasPublicId("gnt"), Timestamps) {
  /** The note's text. */
  @Str({ max: 500 })
  text!: string;
}

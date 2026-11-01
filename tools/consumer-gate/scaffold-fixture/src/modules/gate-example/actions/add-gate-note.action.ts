/**
 * Stackra file contract:
 * Purpose: `AddGateNoteAction`, the one action of the consumer-gate scaffold fixture: `gate-example.note.add@1`, which
 *          returns the text it was given (no database write, so the fixture needs no live Postgres).
 * Boundary: the fixture the `scaffold` consumer copies into a scaffolded service (STA-1813).
 * Runtime: node
 * Governing contract: ADR 0294 (the v3 shape); ADR 0500 (decision 3).
 */
import { Action, ActorKind } from "@stackra/actions";

/** Adds a note. */
export class AddGateNoteAction extends Action({
  key: "note.add",
  actors: [ActorKind.User],
}) {
  /** Echoes the note. */
  async handle(input: { text: string }): Promise<{ text: string }> {
    return { text: input.text };
  }
}

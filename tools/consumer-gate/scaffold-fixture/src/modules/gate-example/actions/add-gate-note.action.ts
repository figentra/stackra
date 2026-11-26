/**
 * Stackra file contract:
 * Purpose: `AddGateNoteAction`, the one action of the consumer-gate scaffold fixture: `gate-example.note.add@1`, which
 *          answers the text it was given (no database write, so the fixture's unit test needs no Postgres).
 * Boundary: the fixture the `scaffold` consumer copies into the service `stackra new service` adds (STA-1813, STA-2705);
 *           written as a user writes an action today, so a core change that breaks that shape turns the gate red.
 * Runtime: node
 * Governing contract: ADR 0294 (the v3 shape); ADR 0500 (decision 3).
 */
import { Action, type ActionContext, Idempotency } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import type { AddGateNoteInput } from "#modules/gate-example/schemas/add-gate-note-input.schema";
import { AddGateNoteOutput } from "#modules/gate-example/schemas/add-gate-note-output.schema";

/** Adds a note: answers the text, unless the client repeats it with the same `Idempotency-Key`. */
export class AddGateNoteAction extends Action({
  key: "note.add",
  actors: [ActorKind.User],
  idempotency: Idempotency.Optional,
}) {
  /** Answers the note's text. */
  async handle(input: AddGateNoteInput, _ctx: ActionContext): Promise<AddGateNoteOutput> {
    return AddGateNoteOutput.create({ text: input.text });
  }
}

/**
 * Stackra file contract:
 * Purpose: the one test of the consumer-gate scaffold fixture: the action is `note.add` for users and answers the text.
 * Boundary: unit tier; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1813; STA-2705.
 */
import { Idempotency } from "@stackra/actions";
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AddGateNoteAction } from "#modules/gate-example/actions/add-gate-note.action";
import { AddGateNoteInput } from "#modules/gate-example/schemas/add-gate-note-input.schema";

/** The note.add action. */
describe(AddGateNoteAction, () => {
  it("is the note.add action for users", () => {
    expect(kindOf(AddGateNoteAction)?.options).toMatchObject({
      key: "note.add",
      actors: [ActorKind.User],
      idempotency: Idempotency.Optional,
    });
  });

  it("answers the text", async () => {
    const output = await new AddGateNoteAction().handle(
      AddGateNoteInput.create({ text: "hello" }),
      fakeActionContext(),
    );
    expect({ ...output }).toEqual({ text: "hello" });
  });
});

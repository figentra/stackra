/**
 * Stackra file contract:
 * Purpose: unit tests of `UpdateNoteAction`: the `note.update` action changes only the fields given, answers the note as stored, records `NoteUpdated`, and refuses an update that names no field before it reads or writes anything.
 * Boundary: test only; the action is called directly with a stand-in note service and a fake action context.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0098; ADR 0294 (as amended by programming model v3.1, AGENTS.md).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, type PublicId } from "@stackra/contracts";
import { takeRecordedEvents } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { UpdateNoteAction } from "#modules/notes/actions/update-note.action";
import { EmptyNoteUpdateError } from "#modules/notes/errors/empty-note-update.error";
import { NoteUpdated } from "#modules/notes/events/note-updated.event";
import { Note } from "#modules/notes/models/note.model";
import { UpdateNoteInput } from "#modules/notes/schemas/update-note-input.schema";
import type { NoteService } from "#modules/notes/services/note.service";

const noteId = "not_01ja0000000000000000000001" as PublicId<"not">;
const at = new Date("2026-11-02T08:00:00.000Z");

/** A note service over one stored note whose `update` applies the data and records the calls. */
function service(): { notes: NoteService; calls: { where: object; data: object }[]; note: Note } {
  const note = Object.assign(new Note(), {
    id: noteId,
    title: "Buy milk",
    body: "Two litres",
    createdAt: at,
    updatedAt: at,
  });
  const calls: { where: object; data: object }[] = [];
  const notes = {
    update: async (where: object, data: object) => {
      calls.push({ where, data });
      return Object.assign(note, data);
    },
  } as unknown as NoteService;
  return { notes, calls, note };
}

/** The note.update action. */
describe(UpdateNoteAction, () => {
  /** Its key and actors are what gen derives the route, permission and tool from. */
  it("is the note.update action for users and agents", () => {
    expect(kindOf(UpdateNoteAction)?.options).toMatchObject({
      key: "note.update",
      actors: [ActorKind.User, ActorKind.Agent],
    });
  });

  /** Only the given field goes to the service; the other is kept. */
  it("changes only the fields given", async () => {
    const { notes, calls } = service();
    const output = await new UpdateNoteAction(notes).handle(
      UpdateNoteInput.create({ noteId, title: "Buy oat milk" }),
      fakeActionContext(),
    );
    expect(calls).toEqual([{ where: { id: noteId }, data: { title: "Buy oat milk" } }]);
    expect(output.title).toBe("Buy oat milk");
    expect(output.body).toBe("Two litres");
  });

  /** An empty text is a change (it clears the text), not an absent field. */
  it("treats an empty text as a change", async () => {
    const { notes, calls } = service();
    await new UpdateNoteAction(notes).handle(
      UpdateNoteInput.create({ noteId, body: "" }),
      fakeActionContext(),
    );
    expect(calls[0]?.data).toEqual({ body: "" });
  });

  /** Both fields together. */
  it("changes both fields when both are given", async () => {
    const { notes, calls } = service();
    await new UpdateNoteAction(notes).handle(
      UpdateNoteInput.create({ noteId, title: "T", body: "B" }),
      fakeActionContext(),
    );
    expect(calls[0]?.data).toEqual({ title: "T", body: "B" });
  });

  /** An update that changes nothing is refused before the service is touched. */
  it("refuses an update that names no field, without calling the service", async () => {
    const { notes, calls } = service();
    await expect(
      new UpdateNoteAction(notes).handle(UpdateNoteInput.create({ noteId }), fakeActionContext()),
    ).rejects.toBeInstanceOf(EmptyNoteUpdateError);
    expect(calls).toEqual([]);
  });

  /** The event rides on the note, with its id only. */
  it("records NoteUpdated with the note's id only", async () => {
    const { notes, note } = service();
    await new UpdateNoteAction(notes).handle(
      UpdateNoteInput.create({ noteId, body: "secret" }),
      fakeActionContext(),
    );
    const events = takeRecordedEvents(note);
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(NoteUpdated);
    expect({ ...events[0] }).toEqual({ noteId });
  });
});

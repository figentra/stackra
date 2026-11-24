/**
 * Stackra file contract:
 * Purpose: unit tests of `DeleteNoteAction`: the `note.delete` action finds the note first (so a missing or foreign note is `not_found`, never a silent success), records `NoteDeleted` on it, deletes the row and answers its id.
 * Boundary: test only; the action is called directly with a stand-in note service and a fake action context.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0098; ADR 0294 (as amended by programming model v3.1, AGENTS.md).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, type PublicId } from "@stackra/contracts";
import { takeRecordedEvents } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { DeleteNoteAction } from "#modules/notes/actions/delete-note.action";
import { NoteDeleted } from "#modules/notes/events/note-deleted.event";
import { Note } from "#modules/notes/models/note.model";
import { DeleteNoteInput } from "#modules/notes/schemas/delete-note-input.schema";
import type { NoteService } from "#modules/notes/services/note.service";

const noteId = "not_01ja0000000000000000000001" as PublicId<"not">;

/** A note service holding one note (or none), recording what is deleted. */
function service(note: Note | undefined): { notes: NoteService; deleted: object[] } {
  const deleted: object[] = [];
  const notes = {
    findOneOrFail: async () => {
      if (note === undefined) throw new Error("not_found");
      return note;
    },
    delete: async (where: object) => {
      deleted.push(where);
      return 1;
    },
  } as unknown as NoteService;
  return { notes, deleted };
}

/** The note.delete action. */
describe(DeleteNoteAction, () => {
  /** Its key and actors are what gen derives the route, permission and tool from. */
  it("is the note.delete action for users and agents", () => {
    expect(kindOf(DeleteNoteAction)?.options).toMatchObject({
      key: "note.delete",
      actors: [ActorKind.User, ActorKind.Agent],
    });
  });

  /** The row goes, and the answer is its id. */
  it("deletes the note and answers its id", async () => {
    const note = Object.assign(new Note(), { id: noteId });
    const { notes, deleted } = service(note);
    const output = await new DeleteNoteAction(notes).handle(
      DeleteNoteInput.create({ noteId }),
      fakeActionContext(),
    );
    expect({ ...output }).toEqual({ id: noteId });
    expect(deleted).toEqual([{ id: noteId }]);
  });

  /** The event is recorded before the row goes, with the id only. */
  it("records NoteDeleted with the note's id only", async () => {
    const note = Object.assign(new Note(), { id: noteId, title: "secret" });
    const { notes } = service(note);
    await new DeleteNoteAction(notes).handle(
      DeleteNoteInput.create({ noteId }),
      fakeActionContext(),
    );
    const events = takeRecordedEvents(note);
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(NoteDeleted);
    expect({ ...events[0] }).toEqual({ noteId });
  });

  /** A note that is not there (or is another tenant's) is not found, and nothing is deleted. */
  it("fails when the note is not found, deleting nothing", async () => {
    const { notes, deleted } = service(undefined);
    await expect(
      new DeleteNoteAction(notes).handle(DeleteNoteInput.create({ noteId }), fakeActionContext()),
    ).rejects.toThrow("not_found");
    expect(deleted).toEqual([]);
  });
});

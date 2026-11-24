/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateNoteAction`: the `note.create` action for users and agents, which stores the title and text (an empty text when none), answers the note as stored and records `NoteCreated` on it.
 * Boundary: test only; the action is called directly with a stand-in note service and a fake action context. The pipeline's permission, tenancy and transaction are the pipeline's own tests, and the real database's are the integration tests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0098; ADR 0294 (as amended by programming model v3.1, AGENTS.md).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, type PublicId } from "@stackra/contracts";
import { takeRecordedEvents } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { CreateNoteAction } from "#modules/notes/actions/create-note.action";
import { NoteCreated } from "#modules/notes/events/note-created.event";
import { Note } from "#modules/notes/models/note.model";
import { CreateNoteInput } from "#modules/notes/schemas/create-note-input.schema";
import type { NoteService } from "#modules/notes/services/note.service";

const noteId = "not_01ja0000000000000000000001" as PublicId<"not">;
const at = new Date("2026-11-02T08:00:00.000Z");

/** A note service whose `create` records what it was given and answers a stored note. */
function service(): { notes: NoteService; created: object[]; stored: () => Note | undefined } {
  const created: object[] = [];
  let stored: Note | undefined;
  const notes = {
    create: (data: object) => {
      created.push(data);
      stored = Object.assign(new Note(), { id: noteId, createdAt: at, updatedAt: at }, data);
      return stored;
    },
  } as unknown as NoteService;
  return { notes, created, stored: () => stored };
}

/** The note.create action. */
describe(CreateNoteAction, () => {
  /** Its key, actors and idempotency are what gen derives the route, permission and tool from. */
  it("is the note.create action for users and agents, with a required idempotency key", () => {
    expect(kindOf(CreateNoteAction)?.options).toMatchObject({
      key: "note.create",
      actors: [ActorKind.User, ActorKind.Agent],
      idempotency: "required",
    });
  });

  /** The service gets exactly the title and text, and the answer is the stored row. */
  it("stores the title and text and answers the note as stored", async () => {
    const { notes, created } = service();
    const output = await new CreateNoteAction(notes).handle(
      CreateNoteInput.create({ title: "Buy milk", body: "Two litres" }),
      fakeActionContext(),
    );
    expect(created).toEqual([{ title: "Buy milk", body: "Two litres" }]);
    expect({ ...output }).toEqual({
      id: noteId,
      title: "Buy milk",
      body: "Two litres",
      createdAt: at,
      updatedAt: at,
    });
  });

  /** A title-only note stores an empty text, not a null. */
  it("stores an empty text when none is given", async () => {
    const { notes, created } = service();
    await new CreateNoteAction(notes).handle(
      CreateNoteInput.create({ title: "Buy milk" }),
      fakeActionContext(),
    );
    expect(created).toEqual([{ title: "Buy milk", body: "" }]);
  });

  /** The event is recorded on the new note, carrying its id and nothing of its content. */
  it("records NoteCreated with the note's id only", async () => {
    const { notes, stored } = service();
    await new CreateNoteAction(notes).handle(
      CreateNoteInput.create({ title: "Buy milk", body: "secret text" }),
      fakeActionContext(),
    );
    const events = takeRecordedEvents(stored() as Note);
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(NoteCreated);
    expect({ ...events[0] }).toEqual({ noteId });
    expect(JSON.stringify(events[0])).not.toContain("secret");
  });
});

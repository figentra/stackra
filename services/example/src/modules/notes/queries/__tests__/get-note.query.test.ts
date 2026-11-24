/**
 * Stackra file contract:
 * Purpose: unit tests of `GetNoteQuery`: the `note.get` query reads one note by its public id and answers the view; a missing note fails with the service's refusal.
 * Boundary: test only; the query is called directly with a stand-in note service and a fake context.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0098; ADR 0294 (as amended by programming model v3.1, AGENTS.md).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, type PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Note } from "#modules/notes/models/note.model";
import { GetNoteQuery } from "#modules/notes/queries/get-note.query";
import { GetNoteInput } from "#modules/notes/schemas/get-note-input.schema";
import type { NoteService } from "#modules/notes/services/note.service";

const noteId = "not_01ja0000000000000000000001" as PublicId<"not">;
const at = new Date("2026-11-02T08:00:00.000Z");

/** The note.get query. */
describe(GetNoteQuery, () => {
  /** Its key and actors are what gen derives the route, permission and tool from. */
  it("is the note.get query for users and agents", () => {
    expect(kindOf(GetNoteQuery)?.options).toMatchObject({
      key: "note.get",
      actors: [ActorKind.User, ActorKind.Agent],
    });
  });

  /** It asks the service for the id and answers the view. */
  it("answers the note with the given id as a view", async () => {
    const asked: object[] = [];
    const notes = {
      findOneOrFail: async (where: object) => {
        asked.push(where);
        return Object.assign(new Note(), {
          id: noteId,
          title: "T",
          body: "B",
          createdAt: at,
          updatedAt: at,
        });
      },
    } as unknown as NoteService;
    const output = await new GetNoteQuery(notes).handle(
      GetNoteInput.create({ noteId }),
      fakeActionContext() as never,
    );
    expect(asked).toEqual([{ id: noteId }]);
    expect({ ...output }).toEqual({
      id: noteId,
      title: "T",
      body: "B",
      createdAt: at,
      updatedAt: at,
    });
  });

  /** The service's not-found passes through. */
  it("fails when the note is not found", async () => {
    const notes = {
      findOneOrFail: async () => {
        throw new Error("not_found");
      },
    } as unknown as NoteService;
    await expect(
      new GetNoteQuery(notes).handle(GetNoteInput.create({ noteId }), fakeActionContext() as never),
    ).rejects.toThrow("not_found");
  });
});

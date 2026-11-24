/**
 * Stackra file contract:
 * Purpose: `ListNotesQuery`, `notes.note.list@1`: the caller's notes, newest first, one cursor page at a time. `GET /notes` by the endpoint convention and an MCP tool.
 * Boundary: read only, uncached; its permission is `NotePermissions.read` (L0). The cursor is the last note's public id: ids are minted over UUIDv7, so their order is the creation order. The row policy, not a filter here, keeps other tenants' notes out.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0098; ADR 0305 (one declaration per file).; the HTTP conventions (cursor pagination).
 */
import { Query, type QueryContext } from "@stackra/actions";
import { ActorKind, type PublicId, SortDirection } from "@stackra/contracts";

import { noteViewOf } from "#modules/notes/functions/note-view-of.function";
import type { ListNotesInput } from "#modules/notes/schemas/list-notes-input.schema";
import { ListNotesOutput } from "#modules/notes/schemas/list-notes-output.schema";
import type { NoteService } from "#modules/notes/services/note.service";

/** Reads one row more than the page, to know whether another page follows. */
export class ListNotesQuery extends Query({
  key: "note.list",
  actors: [ActorKind.User, ActorKind.Agent],
}) {
  private readonly notes: NoteService;

  /**
   * @param notes - reads the rows.
   */
  constructor(notes: NoteService) {
    super();
    this.notes = notes;
  }

  /** The page after `input.cursor` (the first page without one). */
  async handle(input: ListNotesInput, _ctx: QueryContext): Promise<ListNotesOutput> {
    const after = input.cursor as PublicId<"not"> | undefined;
    const rows = await this.notes.find(after === undefined ? {} : { id: { $lt: after } }, {
      orderBy: { id: SortDirection.Desc },
      limit: input.limit + 1,
    });
    const items = rows.slice(0, input.limit);
    const last = items.at(-1);
    const hasMore = rows.length > input.limit && last !== undefined;
    return ListNotesOutput.create({
      items: items.map((note) => noteViewOf(note)),
      hasMore,
      ...(hasMore ? { nextCursor: last.id } : {}),
    });
  }
}

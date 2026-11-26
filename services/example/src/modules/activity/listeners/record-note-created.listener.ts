/**
 * Stackra file contract:
 * Purpose: `RecordNoteCreatedListener`: on `notes.note.created.v1` it adds a `note_created` entry to the tenant's
 *          activity feed.
 * Boundary: subscribed by the type of `handle`'s first parameter (gen writes `registerListeners`); a sibling module's
 *           public `events/` group is all it imports from notes. It runs after the note's call committed, once per
 *           event id, in the event's tenant, so the entry takes that tenant; a failure is recorded on its delivery and
 *           never reaches the call that created the note.
 * Runtime: node
 * Governing contract: ADR 0078 (decisions 2 to 4: listeners run after commit); ADR 0294 (decision 24: sibling modules);
 *                     ADR 0141 (integration events).
 */
import { Listener, type ListenerContext } from "@stackra/events";

import { ActivityKind } from "#modules/activity/enums/activity-kind.enum";
import type { ActivityEntryService } from "#modules/activity/services/activity-entry.service";
import type { NoteCreated } from "#modules/notes/events/note-created.event";

/** Records a created note in the feed. */
export class RecordNoteCreatedListener extends Listener {
  private readonly entries: ActivityEntryService;

  /**
   * @param entries - writes the entry.
   */
  constructor(entries: ActivityEntryService) {
    super();
    this.entries = entries;
  }

  /** Adds the entry at the event's time. */
  async handle(event: NoteCreated, ctx: ListenerContext): Promise<void> {
    const entry = await this.entries.record(ActivityKind.NoteCreated, event.noteId, ctx.occurredAt);
    ctx.audit({ entryId: entry.id, noteId: event.noteId });
  }
}

/**
 * Stackra file contract:
 * Purpose: `RecordNoteDeletedListener`: on `notes.note.deleted.v1` it adds a `note_deleted` entry to the tenant's
 *          activity feed, so the feed keeps the deletion after the note is gone.
 * Boundary: subscribed by the type of `handle`'s first parameter; runs after the delete committed, once per event id,
 *           in the event's tenant. It never reads the note (there is none left), only the event's id.
 * Runtime: node
 * Governing contract: ADR 0078 (decisions 2 to 4); ADR 0294 (decision 24); ADR 0141.
 */
import { Listener, type ListenerContext } from "@stackra/events";

import { ActivityKind } from "#modules/activity/enums/activity-kind.enum";
import type { ActivityEntryService } from "#modules/activity/services/activity-entry.service";
import type { NoteDeleted } from "#modules/notes/events/note-deleted.event";

/** Records a deleted note in the feed. */
export class RecordNoteDeletedListener extends Listener {
  private readonly entries: ActivityEntryService;

  /**
   * @param entries - writes the entry.
   */
  constructor(entries: ActivityEntryService) {
    super();
    this.entries = entries;
  }

  /** Adds the entry at the event's time. */
  async handle(event: NoteDeleted, ctx: ListenerContext): Promise<void> {
    const entry = await this.entries.record(ActivityKind.NoteDeleted, event.noteId, ctx.occurredAt);
    ctx.audit({ entryId: entry.id, noteId: event.noteId });
  }
}

/**
 * Stackra file contract:
 * Purpose: `RecordNoteUpdatedListener`: on `notes.note.updated.v1` it adds a `note_updated` entry to the tenant's
 *          activity feed.
 * Boundary: subscribed by the type of `handle`'s first parameter; runs after the update committed, once per event id,
 *           in the event's tenant. The event carries the note's id only, so the feed never holds a title or a text.
 * Runtime: node
 * Governing contract: ADR 0078 (decisions 2 to 4); ADR 0294 (decision 24); ADR 0141.
 */
import { Listener, type ListenerContext } from "@stackra/events";

import { ActivityKind } from "#modules/activity/enums/activity-kind.enum";
import type { ActivityEntryService } from "#modules/activity/services/activity-entry.service";
import type { NoteUpdated } from "#modules/notes/events/note-updated.event";

/** Records an updated note in the feed. */
export class RecordNoteUpdatedListener extends Listener {
  private readonly entries: ActivityEntryService;

  /**
   * @param entries - writes the entry.
   */
  constructor(entries: ActivityEntryService) {
    super();
    this.entries = entries;
  }

  /** Adds the entry at the event's time. */
  async handle(event: NoteUpdated, ctx: ListenerContext): Promise<void> {
    const entry = await this.entries.record(ActivityKind.NoteUpdated, event.noteId, ctx.occurredAt);
    ctx.audit({ entryId: entry.id, noteId: event.noteId });
  }
}

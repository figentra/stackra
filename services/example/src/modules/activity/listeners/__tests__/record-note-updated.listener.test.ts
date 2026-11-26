/**
 * Stackra file contract:
 * Purpose: unit tests of `RecordNoteUpdatedListener`: on `NoteUpdated` it records a `note_updated` entry for the event's note at the
 *          event's time (not the time it runs), and adds the entry and the note to its delivery's audit.
 * Boundary: test only; the listener is called directly with a recording stand-in for `ActivityEntryService` and a
 *           listener context built here. That it runs after the commit, once, in the event's tenant is the bus's and
 *           the inbox's (`activity-feed.test.ts`, `activity-isolation.int.test.ts`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0078 (decisions 2 to 4).
 */
import type { Json, PublicId } from "@stackra/contracts";
import type { ListenerContext } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { ActivityKind } from "#modules/activity/enums/activity-kind.enum";
import { RecordNoteUpdatedListener } from "#modules/activity/listeners/record-note-updated.listener";
import { ActivityEntry } from "#modules/activity/models/activity-entry.model";
import type { ActivityEntryService } from "#modules/activity/services/activity-entry.service";
import { NoteUpdated } from "#modules/notes/events/note-updated.event";

const noteId = "not_01ja0000000000000000000001" as PublicId<"not">;
const entryId = "act_01ja0000000000000000000001" as PublicId<"act">;
const occurredAt = new Date("2026-06-01T09:00:00.000Z");

/** A service that keeps what it was asked to record. */
function recordingEntries() {
  const recorded: unknown[][] = [];
  const entries = {
    record: async (...args: unknown[]) => {
      recorded.push(args);
      return Object.assign(new ActivityEntry(), { id: entryId });
    },
  } as unknown as ActivityEntryService;
  return { entries, recorded };
}

/** The context the bus hands the listener, with the fields it audits. */
function contextOf(audited: Record<string, Json>): ListenerContext {
  return {
    eventId: "evt_1",
    occurredAt,
    now: () => new Date("2026-06-01T09:00:03.000Z"),
    audit: (fields) => Object.assign(audited, fields),
  };
}

describe(RecordNoteUpdatedListener, () => {
  it("records a note_updated entry for the note at the event's time and audits it", async () => {
    const { entries, recorded } = recordingEntries();
    const audited: Record<string, Json> = {};

    await new RecordNoteUpdatedListener(entries).handle(
      NoteUpdated.create({ noteId }),
      contextOf(audited),
    );

    expect(recorded).toEqual([[ActivityKind.NoteUpdated, noteId, occurredAt]]);
    expect(audited).toEqual({ entryId, noteId });
  });
});

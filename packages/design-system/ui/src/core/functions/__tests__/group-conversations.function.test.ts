/**
 * Stackra file contract:
 * Purpose: proves `groupConversations` puts pinned conversations first, then sorts the rest into Today, Yesterday,
 *          Previous 7 days and Older by calendar day, newest first, leaving empty groups out; and `isNearBottom`
 *          counts the last few pixels as the bottom.
 * Boundary: pure functions; local dates built from parts so the result holds in any time zone.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { groupConversations } from "#core/functions/group-conversations.function";
import { isNearBottom } from "#core/functions/is-near-bottom.function";

/** 30 October 2026, 10:00 local time. */
const NOW = new Date(2026, 9, 30, 10, 0);

/** A local time `days` days before NOW's date, at `hour`. */
const daysAgo = (days: number, hour = 9) => new Date(2026, 9, 30 - days, hour, 0);

describe("groupConversations", () => {
  it("groups by calendar day, pinned first, newest first", () => {
    const groups = groupConversations(
      [
        { id: "old", title: "Old", updatedAt: daysAgo(30) },
        { id: "late-yesterday", title: "Y2", updatedAt: daysAgo(1, 23) },
        { id: "early-today", title: "T1", updatedAt: daysAgo(0, 0) },
        { id: "pinned-old", title: "P", updatedAt: daysAgo(40), isPinned: true },
        { id: "week", title: "W", updatedAt: daysAgo(7, 12).toISOString() },
        { id: "late-today", title: "T2", updatedAt: daysAgo(0, 9) },
        { id: "early-yesterday", title: "Y1", updatedAt: daysAgo(1, 0) },
        { id: "eight", title: "E", updatedAt: daysAgo(8) },
      ],
      NOW,
    );
    expect(groups.map((group) => [group.id, group.items.map((item) => item.id)])).toEqual([
      ["pinned", ["pinned-old"]],
      ["today", ["late-today", "early-today"]],
      ["yesterday", ["late-yesterday", "early-yesterday"]],
      ["previous_7_days", ["week"]],
      ["older", ["eight", "old"]],
    ]);
  });

  it("counts a future date as today, an invalid one as older, and leaves empty groups out", () => {
    const groups = groupConversations(
      [
        { id: "future", title: "F", updatedAt: daysAgo(-2) },
        { id: "bad", title: "B", updatedAt: "not a date" },
      ],
      NOW,
    );
    expect(groups.map((group) => group.id)).toEqual(["today", "older"]);
    expect(groupConversations([], NOW)).toEqual([]);
  });
});

describe("isNearBottom", () => {
  it("is true within 24 of the bottom and false above it", () => {
    expect(isNearBottom(600, 1000, 400)).toBe(true);
    expect(isNearBottom(580, 1000, 400)).toBe(true);
    expect(isNearBottom(570, 1000, 400)).toBe(false);
    expect(isNearBottom(0, 300, 400)).toBe(true);
  });
});

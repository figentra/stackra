/**
 * Stackra file contract:
 * Purpose: unit tests of `icalFeed`: the calendar frame, UTC times, TEXT escaping, status, folding at 75 octets
 *          without splitting a character, and the refusals.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); RFC 5545.
 */
import { describe, expect, it } from "@stackra/testing";

import { IcalStatus } from "#core/enums/ical-status.enum";
import { icalFeed } from "#core/functions/ical-feed.function";

const event = {
  uid: "bkg_1@example.com",
  start: "2026-11-02T12:00:00+03:00",
  end: "2026-11-02T09:45:00Z",
  summary: "Cut, wash; dry\nnext",
};

describe("icalFeed", () => {
  it("writes the frame, UTC times, escaped text and status", () => {
    const feed = icalFeed({
      prodId: "-//Example//Scheduling//EN",
      name: "Chair 1",
      stamp: "2026-11-01T08:00:00Z",
      events: [{ ...event, status: IcalStatus.Tentative }],
    });

    expect(
      feed.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Example//Scheduling//EN\r\n"),
    ).toBe(true);
    expect(feed).toContain("X-WR-CALNAME:Chair 1\r\n");
    expect(feed).toContain("UID:bkg_1@example.com\r\n");
    expect(feed).toContain("DTSTAMP:20261101T080000Z\r\n");
    expect(feed).toContain("DTSTART:20261102T090000Z\r\n");
    expect(feed).toContain("DTEND:20261102T094500Z\r\n");
    expect(feed).toContain("SUMMARY:Cut\\, wash\\; dry\\nnext\r\n");
    expect(feed).toContain("STATUS:TENTATIVE\r\n");
    expect(feed.endsWith("END:VEVENT\r\nEND:VCALENDAR\r\n")).toBe(true);
  });

  it("leaves out an absent name and status", () => {
    const feed = icalFeed({
      prodId: "-//X//Y//EN",
      stamp: "2026-11-01T08:00:00Z",
      events: [event],
    });

    expect(feed).not.toContain("X-WR-CALNAME");
    expect(feed).not.toContain("STATUS:");
  });

  it("folds at 75 octets without splitting a character", () => {
    const summary = "é".repeat(100);
    const feed = icalFeed({
      prodId: "-//X//Y//EN",
      stamp: "2026-11-01T08:00:00Z",
      events: [{ ...event, summary }],
    });
    const lines = feed.split("\r\n");
    const encoder = new TextEncoder();

    for (const line of lines) expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    const summaryAt = lines.findIndex((line) => line.startsWith("SUMMARY:"));
    const unfolded = lines
      .slice(summaryAt)
      .reduce(
        (all, line, index) =>
          index === 0 || line.startsWith(" ") ? all + line.slice(index === 0 ? 0 : 1) : all,
        "",
      );
    expect(unfolded).toBe(`SUMMARY:${summary}`);
  });

  it("refuses a line break in a raw value", () => {
    expect(() =>
      icalFeed({
        prodId: "-//X//Y//EN",
        stamp: "2026-11-01T08:00:00Z",
        events: [{ ...event, uid: "a\r\nX:1" }],
      }),
    ).toThrow(RangeError);
  });

  it("refuses an instant without an offset and an empty span", () => {
    expect(() =>
      icalFeed({ prodId: "-//X//Y//EN", stamp: "2026-11-01T08:00:00", events: [] }),
    ).toThrow(RangeError);
    expect(() =>
      icalFeed({
        prodId: "-//X//Y//EN",
        stamp: "2026-11-01T08:00:00Z",
        events: [{ ...event, end: event.start }],
      }),
    ).toThrow(RangeError);
  });
});

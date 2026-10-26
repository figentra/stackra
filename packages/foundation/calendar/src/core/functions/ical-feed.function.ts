/**
 * Stackra file contract:
 * Purpose: `icalFeed`, the RFC 5545 text of a read-only published calendar: one VEVENT per event with its UID, times
 *          in UTC, summary and status, TEXT escaped, lines folded at 75 octets and ended with CRLF.
 * Boundary: pure; no clock (the stamp is an argument) and no product data (PRODID and UIDs come from the caller).
 *           An instant without an offset, an end not after its start, or a line break in PRODID or a UID is refused
 *           with a `RangeError`.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 (3.1 folding, 3.3.5 UTC date-time, 3.3.11 TEXT); moved from OS scheduling-calendar
 *                     `icalFeed` (STA-1262).
 */
import { instantMs } from "#core/functions/instant-ms.function";
import type { IcalFeed } from "#core/types/ical-feed.type";

/** `20261102T090000Z`. */
const utc = (ms: number): string =>
  new Date(ms)
    .toISOString()
    .replaceAll(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

/** RFC 5545 TEXT escaping. */
const text = (value: string): string =>
  value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll(/\r\n|\r|\n/g, "\\n");

/** A raw (unescaped) value; a line break in it would start a forged content line. */
const raw = (name: string, value: string): string => {
  if (/[\r\n]/.test(value)) throw new RangeError(`${name} holds a line break`);
  return value;
};

const encoder = new TextEncoder();

/** Folds a content line so no line exceeds 75 octets, never splitting a character. */
const fold = (line: string): string => {
  const lines: string[] = [];
  let current = "";
  let octets = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    // A continuation line starts with one space, which counts toward its 75.
    if (octets + size > 75) {
      lines.push(current);
      current = " ";
      octets = 1;
    }
    current += char;
    octets += size;
  }
  lines.push(current);
  return lines.join("\r\n");
};

/**
 * The feed as RFC 5545 text, CRLF line ends.
 *
 * @example
 * icalFeed({
 *   prodId: "-//Example//Scheduling//EN",
 *   stamp: "2026-11-01T08:00:00Z",
 *   events: [{ uid: "bkg_1@example.com", start: "2026-11-02T09:00:00Z", end: "2026-11-02T09:45:00Z", summary: "Cut" }],
 * });
 */
export function icalFeed(feed: IcalFeed): string {
  const stamp = utc(instantMs(feed.stamp));
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${raw("PRODID", feed.prodId)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  if (feed.name !== undefined) lines.push(`X-WR-CALNAME:${text(feed.name)}`);
  for (const event of feed.events) {
    const start = instantMs(event.start);
    const end = instantMs(event.end);
    if (end <= start) throw new RangeError(`Event ${event.uid} ends at or before its start`);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${raw("UID", event.uid)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${utc(start)}`,
      `DTEND:${utc(end)}`,
      `SUMMARY:${text(event.summary)}`,
    );
    if (event.status !== undefined) lines.push(`STATUS:${event.status.toUpperCase()}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

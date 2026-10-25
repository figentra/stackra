/**
 * Stackra file contract:
 * Purpose: `sendAfter(input)`, when a notification may go out: now for a mandatory category (security, safety, legal
 *          notices) or outside quiet hours, otherwise at the end of the recipient's quiet window.
 * Boundary: pure apart from Intl's time-zone data. The mandatory categories are a settings floor
 *           (`settings:platform-floor:mandatory-categories`, OS-195) and the window a setting (OS-196); nothing is
 *           defaulted here.
 * Runtime: isomorphic
 * Governing contract: OS-195, OS-196; ADR 0086 (decision 1: quiet hours); row "mandatory categories that ignore quiet
 *                     hours" of the package needs.
 */
import type { QuietHours } from "#contracts/types/quiet-hours.type";

/** Minutes since local midnight of `at` in `timeZone`. */
function localMinutes(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return value("hour") * 60 + value("minute");
}

/** Minutes since midnight of `HH:mm`. */
function minutesOf(time: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (match === null) throw new RangeError(`sendAfter: "${time}" is not HH:mm`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * The earliest time the notification may be sent.
 *
 * @throws RangeError when a window time is not `HH:mm`.
 * @example
 * sendAfter({ category: "marketing", mandatory: ["security"], quietHours, now }); // 07:00 local, or now
 */
export function sendAfter(input: {
  readonly category: string;
  readonly mandatory: readonly string[];
  readonly quietHours?: QuietHours;
  readonly now: Date;
}): Date {
  const window = input.quietHours;
  if (window === undefined || input.mandatory.includes(input.category)) return input.now;
  const start = minutesOf(window.start);
  const end = minutesOf(window.end);
  const local = localMinutes(input.now, window.timeZone);
  const quiet = start <= end ? local >= start && local < end : local >= start || local < end;
  if (!quiet) return input.now;
  const wait = (end - local + 1440) % 1440;
  // shortcut: a daylight-saving change inside the window shifts the end by the change; exact enough for a send time.
  const seconds = input.now.getUTCSeconds() * 1000 + input.now.getUTCMilliseconds();
  return new Date(input.now.getTime() + wait * 60_000 - seconds);
}

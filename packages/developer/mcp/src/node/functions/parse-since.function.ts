/**
 * Stackra file contract:
 * Purpose: `parseSince(since, now)`, the time a tool's `since` option names: a span back from now (`90s`, `15m`, `2h`,
 *          `1d`) or an ISO 8601 timestamp.
 * Boundary: pure. Anything else is a `CommandError` naming the forms it takes, so an assistant can correct its call.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); STA-2889.
 */
import { CommandError } from "@stackra/console";

/** Milliseconds per span unit. */
const UNITS: Readonly<Record<string, number>> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

/**
 * The time `since` names.
 *
 * @param since - a span (`15m`) or an ISO timestamp.
 * @param now - the time a span counts back from.
 * @throws CommandError when `since` is neither.
 * @example
 * parseSince("15m", new Date("2026-11-27T02:15:00Z")); // 2026-11-27T02:00:00.000Z
 */
export function parseSince(since: string, now: Date): Date {
  const span = /^(\d+)\s*([smhd])$/.exec(since.trim());
  if (span !== null)
    return new Date(now.getTime() - Number(span[1]) * (UNITS[span[2] ?? "s"] ?? 1000));
  const time = Date.parse(since);
  if (!Number.isNaN(time) && /^\d{4}-\d{2}-\d{2}/.test(since.trim())) return new Date(time);
  throw new CommandError(`Not a time: ${JSON.stringify(since)}`, {
    fix: "give a span back from now (90s, 15m, 2h, 1d) or an ISO 8601 timestamp",
  });
}

/**
 * Stackra file contract:
 * Purpose: `browserLogEntries(body, member, now)`, the dev log entries of one browser report: `{ entries: [...] }`
 *          with each entry's `kind` (`error`, `rejection`, `console`), `level` (`error` or `warn`), `message`, and the
 *          optional `stack`, `url` and `time`; or, instead of `message`, the structured `args` of a console call (or
 *          a rejection reason that is not an error), whose message is written from `redact(args)`, so the logger's
 *          field-name rules mask a credential or personal field inside them (`{ email }` → `{ email: "[redacted]" }`)
 *          before they become text. The page's URL keeps only its origin and path; a time that is not an
 *          ISO timestamp within a day of `now` becomes `now`; an entry that is not one of these shapes is dropped,
 *          and at most `BROWSER_LOG_LIMITS.entries` are kept.
 * Boundary: pure; never writes. What a page sends is untrusted: nothing here is executed or followed, and the writer
 *           (`appendDevLog`) redacts and cuts every entry.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); ADR 0147 (decision 1); STA-2889.
 */
import { redact } from "@stackra/logger";
import type { DevLogEntry } from "@stackra/runway";

import { BROWSER_LOG_LIMITS } from "#core/constants/browser-log-limits.constant";

/** The kinds a page reports. */
const KINDS: ReadonlySet<unknown> = new Set(["error", "rejection", "console"]);

/** The levels a page reports. */
const LEVELS: ReadonlySet<unknown> = new Set(["error", "warn"]);

/** A day in milliseconds. */
const DAY = 24 * 60 * 60 * 1000;

/** One redacted console argument as text: a string as it is, anything else as JSON. */
function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value) ?? String(value);
}

/** The message of an entry: its structured `args` redacted then joined, else its `message`; undefined when neither. */
function messageOf(entry: Readonly<Record<string, unknown>>): string | undefined {
  const args = entry["args"];
  if (Array.isArray(args)) return (redact(args.slice(0, 50)) as unknown[]).map(textOf).join(" ");
  return typeof entry["message"] === "string" ? entry["message"] : undefined;
}

/** The origin and path of `value`, or undefined when it is not an http(s) URL. */
function pageOf(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.origin + url.pathname
      : undefined;
  } catch {
    return undefined;
  }
}

/** `value` as an ISO time near `now`, else `now`. */
function timeOf(value: unknown, now: Date): string {
  const time = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isNaN(time) || Math.abs(time - now.getTime()) > DAY
    ? now.toISOString()
    : new Date(time).toISOString();
}

/**
 * The entries of a browser report.
 *
 * @param body - the parsed request body.
 * @param member - the member folder the dev server serves, relative to the repository root.
 * @param now - the time the report arrived.
 * @example
 * browserLogEntries({ entries: [{ kind: "error", level: "error", message: "TypeError: x" }] }, "apps/console", new Date());
 */
export function browserLogEntries(body: unknown, member: string, now: Date): DevLogEntry[] {
  const entries = (body as { entries?: unknown } | null)?.entries;
  if (!Array.isArray(entries)) return [];
  return entries.slice(0, BROWSER_LOG_LIMITS.entries).flatMap((value: unknown): DevLogEntry[] => {
    if (typeof value !== "object" || value === null) return [];
    const entry = value as Record<string, unknown>;
    const { kind, level, stack } = entry;
    if (!KINDS.has(kind)) return [];
    if (!LEVELS.has(level)) return [];
    const message = messageOf(entry);
    if (message === undefined) return [];
    const url = pageOf(entry["url"]);
    return [
      {
        time: timeOf(entry["time"], now),
        source: "browser",
        level: level as DevLogEntry["level"],
        member,
        kind: kind as NonNullable<DevLogEntry["kind"]>,
        message,
        ...(typeof stack === "string" && stack !== "" ? { stack } : {}),
        ...(url === undefined ? {} : { url }),
      },
    ];
  });
}

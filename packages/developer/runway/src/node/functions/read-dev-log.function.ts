/**
 * Stackra file contract:
 * Purpose: `readDevLog(file)`, the dev log `appendDevLog` wrote, oldest first: the rotated `<name>.1.ndjson`, then the
 *          current file. A line that is not a JSON object with a string `time`, `message`, `source` and `level` is
 *          skipped (a line cut by a crash mid-write), so one bad line never hides the rest.
 * Boundary: node only; reads files, never writes. A missing file reads as no entries.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 1); ADR 0282 (decision 5); STA-2889.
 */
import { existsSync, readFileSync } from "node:fs";

import type { DevLogEntry } from "#core/types/dev-log-entry.type";
import { rotatedDevLog } from "#node/functions/rotated-dev-log.function";

/** The levels an entry may carry. */
const LEVELS: ReadonlySet<unknown> = new Set(["debug", "info", "warn", "error"]);

/** Whether `value` has the fields every entry carries. */
function isEntry(value: unknown): value is DevLogEntry {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry["time"] === "string" &&
    typeof entry["message"] === "string" &&
    (entry["source"] === "server" || entry["source"] === "browser") &&
    LEVELS.has(entry["level"])
  );
}

/** The entries of one file. */
function entriesOf(file: string): DevLogEntry[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line) => {
      if (line.trim() === "") return [];
      try {
        const value: unknown = JSON.parse(line);
        return isEntry(value)
          ? [{ ...value, member: typeof value.member === "string" ? value.member : "." }]
          : [];
      } catch {
        return [];
      }
    });
}

/**
 * The dev log at `file`, oldest first.
 *
 * @param file - the dev log, `devLogFile(from)`.
 * @example
 * readDevLog(devLogFile(root)).filter((entry) => entry.level === "error");
 */
export function readDevLog(file: string): DevLogEntry[] {
  return [...entriesOf(rotatedDevLog(file)), ...entriesOf(file)];
}

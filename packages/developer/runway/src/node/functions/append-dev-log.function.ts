/**
 * Stackra file contract:
 * Purpose: `appendDevLog(file, entries)`, the one writer of the dev log: redacts each entry with the logger's `redact`
 *          (credential and personal field names, secret shapes inside any text), cuts a `message` or `stack` longer
 *          than `DEV_LOG_MAX_TEXT`, and appends the entries as JSON lines in one write. A file that would pass
 *          `DEV_LOG_MAX_BYTES` first moves to `<name>.1.ndjson`, replacing the older one, so the log stays bounded.
 * Boundary: node only; creates the folder when missing. Several processes append to the same file (each member's
 *           `stackra dev` and its Vite server): each call is one append, and a rotation another process already made
 *           is not an error.
 * Runtime: node
 * Governing contract: ADR 0147 (decision 1: redaction with secret detection); ADR 0184 (decision 5: logs carry no
 *                     personal data); ADR 0296 (decision 1); STA-2889.
 */
import { appendFileSync, mkdirSync, renameSync, statSync } from "node:fs";
import { dirname } from "node:path";

import { redact } from "@stackra/logger";

import { DEV_LOG_MAX_BYTES } from "#core/constants/dev-log-max-bytes.constant";
import { DEV_LOG_MAX_TEXT } from "#core/constants/dev-log-max-text.constant";
import type { DevLogEntry } from "#core/types/dev-log-entry.type";
import { rotatedDevLog } from "#node/functions/rotated-dev-log.function";

/** `text` cut to `DEV_LOG_MAX_TEXT` characters, saying how many were cut. */
function cut(text: unknown): unknown {
  if (typeof text !== "string" || text.length <= DEV_LOG_MAX_TEXT) return text;
  return `${text.slice(0, DEV_LOG_MAX_TEXT)} … (${text.length - DEV_LOG_MAX_TEXT} more characters cut)`;
}

/** The size of `file`, or 0 when it does not exist. */
function sizeOf(file: string): number {
  try {
    return statSync(file).size;
  } catch {
    return 0;
  }
}

/**
 * Appends `entries` to the dev log at `file`, redacted.
 *
 * @param file - the dev log, `devLogFile(from)`.
 * @param entries - the entries to add, oldest first.
 * @example
 * appendDevLog(devLogFile(cwd), [{ time, source: "server", level: "error", member: "apps/console", message }]);
 */
export function appendDevLog(file: string, entries: readonly DevLogEntry[]): void {
  if (entries.length === 0) return;
  const text = entries
    .map((entry) => {
      const clean = redact(entry) as Record<string, unknown>;
      return `${JSON.stringify({ ...clean, message: cut(clean["message"]), ...(clean["stack"] === undefined ? {} : { stack: cut(clean["stack"]) }) })}\n`;
    })
    .join("");
  mkdirSync(dirname(file), { recursive: true });
  const size = sizeOf(file);
  if (size > 0 && size + Buffer.byteLength(text) > DEV_LOG_MAX_BYTES) {
    try {
      renameSync(file, rotatedDevLog(file));
    } catch {
      // Another process rotated it first; append to the new file.
    }
  }
  appendFileSync(file, text);
}

/**
 * Stackra file contract:
 * Purpose: `devLogEntryOf(line, context)`, one line a member's dev tool printed as a dev log entry: colour codes
 *          stripped; a JSON object line keeps its own fields and takes its level and message from them (`level` or
 *          `severity` as a word or a pino number, `message` or `msg`); a text line takes its level from the first
 *          level word in it (`ERR`, `ERROR`, `WARN`, `INF`, `DBG`, … as Encore and most tools print them), else from a
 *          JavaScript error line (`TypeError: …`, `Uncaught`, `error:`) or a warning line (`warning:`), else `info`.
 *          An indented line (a stack frame, a detail under a message) takes the level of the line before it on the
 *          same stream, so a whole stack trace is the error it belongs to.
 * Boundary: pure; never writes. A blank line is no entry. Redaction is `appendDevLog`'s, not this.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: explain failures); ADR 0296 (decision 1); STA-2889.
 */
import { stripVTControlCharacters } from "node:util";

import type { DevLogEntry } from "@stackra/runway";

/** The level of an entry. */
type Level = DevLogEntry["level"];

/** Level words as tools print them, upper case, mapped to a level. */
const LEVEL_WORDS: Readonly<Record<string, Level>> = {
  TRC: "debug",
  TRACE: "debug",
  DBG: "debug",
  DEBUG: "debug",
  INF: "info",
  INFO: "info",
  WRN: "warn",
  WARN: "warn",
  WARNING: "warn",
  ERR: "error",
  ERROR: "error",
  FTL: "error",
  FATAL: "error",
  PNC: "error",
  PANIC: "error",
};

/** The first level word in a line. */
const LEVEL_WORD =
  /\b(TRC|TRACE|DBG|DEBUG|INF|INFO|WRN|WARN|WARNING|ERR|ERROR|FTL|FATAL|PNC|PANIC)\b/;

/** A JavaScript error line (`TypeError: …`, `Uncaught Error`) or an unhandled rejection. */
const ERROR_LINE =
  /^\s*(?:Uncaught\s+)?(?:[A-Z][A-Za-z]*)?Error(?::|\s*$)|\b(?:Uncaught|Unhandled)\b/;

/** An `error:` line, any case (`error: …`, `Internal server error: …`). */
const ERROR_COLON = /\berror:/i;

/** A `warning:` line. */
const WARN_LINE = /\bwarn(?:ing)?:/i;

/** Where a line came from, and the level of the line before it on the same stream. */
type LineContext = {
  readonly stream: "stdout" | "stderr";
  readonly member: string;
  readonly time: string;
  readonly previous?: Level | undefined;
};

/** The level a structured line's `level` or `severity` names. */
function levelOfField(value: unknown): Level | undefined {
  if (typeof value === "number") {
    // pino: 10 trace, 20 debug, 30 info, 40 warn, 50 error, 60 fatal.
    if (value >= 50) return "error";
    if (value >= 40) return "warn";
    if (value >= 30) return "info";
    return "debug";
  }
  if (typeof value !== "string") return undefined;
  const word = value.toUpperCase();
  if (word === "CRITICAL" || word === "ALERT" || word === "EMERGENCY") return "error";
  return LEVEL_WORDS[word];
}

/** A JSON object line, or undefined. */
function jsonObject(line: string): Record<string, unknown> | undefined {
  if (!line.startsWith("{")) return undefined;
  try {
    const value: unknown = JSON.parse(line);
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

/** The level of a text line. */
function levelOfText(line: string, previous: Level | undefined): Level {
  if (previous !== undefined && /^\s/.test(line)) return previous;
  const word = LEVEL_WORD.exec(line)?.[1];
  if (word !== undefined) return LEVEL_WORDS[word] ?? "info";
  if (ERROR_LINE.test(line) || ERROR_COLON.test(line)) return "error";
  if (WARN_LINE.test(line)) return "warn";
  return "info";
}

/**
 * The dev log entry of one printed line; undefined for a blank one.
 *
 * @param line - one line of output, without its newline.
 * @param context - its stream, member and time, and the level of the line before it on that stream.
 * @example
 * devLogEntryOf("4:25AM ERR request failed endpoint=orders.list", { stream: "stderr", member: "services/orders", time });
 * // { level: "error", message: "4:25AM ERR request failed endpoint=orders.list", source: "server", ... }
 */
export function devLogEntryOf(line: string, context: LineContext): DevLogEntry | undefined {
  const text = stripVTControlCharacters(line).trimEnd();
  if (text.trim() === "") return undefined;
  const base = {
    time: context.time,
    source: "server" as const,
    member: context.member,
    stream: context.stream,
  };
  const json = jsonObject(text.trimStart());
  if (json !== undefined) {
    const { level, severity, message, msg, time: _time, timestamp: _timestamp, ...fields } = json;
    const said = message ?? msg;
    return {
      ...base,
      level: levelOfField(level) ?? levelOfField(severity) ?? "info",
      message: typeof said === "string" ? said : text,
      ...(Object.keys(fields).length === 0 ? {} : { fields }),
    };
  }
  return { ...base, level: levelOfText(text, context.previous), message: text };
}

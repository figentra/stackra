/**
 * Stackra file contract:
 * Purpose: `DevLogEntry`, one line of the dev log (`DEV_LOG_PATH`): when, where it came from (`server`, a line a
 *          member's dev tool printed; `browser`, something the page reported to the Vite dev server), its level, the
 *          member folder, and the text, with the page, the stack and a structured line's own fields when there are any.
 * Boundary: type only. Every entry is redacted by `appendDevLog` before it is written, so a reader never sees a value
 *           the logger's rules mask.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1); ADR 0282 (decision 5); ADR 0147 (decision 1); STA-2889.
 */

/** One dev log line. */
export type DevLogEntry = {
  /** When it was printed or reported, as an ISO 8601 timestamp. */
  readonly time: string;

  /** `server`: the dev tool's output; `browser`: what the page reported. */
  readonly source: "server" | "browser";

  /** Its level: read from a structured line, a level word, or a JavaScript error line; `info` otherwise. */
  readonly level: "debug" | "info" | "warn" | "error";

  /** The member folder relative to the repository root (`apps/console`); `.` for the root. */
  readonly member: string;

  /** The text, without colour codes. */
  readonly message: string;

  /** The output stream a server line came from. */
  readonly stream?: "stdout" | "stderr";

  /** What the page reported: an uncaught `error`, an unhandled promise `rejection`, or a `console` error or warning. */
  readonly kind?: "error" | "rejection" | "console";

  /** The page it came from: origin and path only, never the query or fragment. */
  readonly url?: string;

  /** The stack, when the page reported one. */
  readonly stack?: string;

  /** A structured (JSON) line's own fields besides its level, message and time. */
  readonly fields?: Readonly<Record<string, unknown>>;
};

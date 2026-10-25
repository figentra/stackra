/**
 * Stackra file contract:
 * Purpose: `sentryEnvelope(error, report)`, the body of one Sentry envelope carrying one error event: the envelope
 *          header, the item header and the event with the error's type, message and stack frames, the refusal code as a
 *          tag, and the environment and release.
 * Boundary: pure. It sends no request context, user, input or breadcrumbs (ADR 0184: telemetry carries no personal
 *           data); a non-Error value is reported by its type only, never its contents. Frames are read from V8 and
 *           Firefox stack lines, innermost last, as Sentry expects; an unparsable stack sends no frames.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decisions 5 and 6); the Sentry envelope protocol.
 */
import { isRefusal } from "#core/functions/is-refusal.function";

/** What one report carries besides the error. */
interface Report {
  /** 32 lowercase hex characters. */
  readonly eventId: string;
  readonly at: Date;
  readonly dsn: string;
  readonly environment: string;
  readonly release: string;
}

/** A stack frame as Sentry reads it. */
interface Frame {
  readonly function?: string;
  readonly filename: string;
  readonly lineno?: number;
  readonly colno?: number;
}

/** `at fn (file:1:2)`, `at file:1:2` (V8) and `fn@file:1:2` (Firefox, Safari). */
const FRAME = /^\s*(?:at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?|(.*?)@(.+?):(\d+):(\d+))\s*$/;

/** The frames of `stack`, outermost first (a stack lists the innermost first). */
function framesOf(stack: string | undefined): readonly Frame[] {
  const frames: Frame[] = [];
  for (const line of (stack ?? "").split("\n")) {
    const match = FRAME.exec(line);
    if (match === null) continue;
    const name = match[1] ?? match[5];
    frames.unshift({
      ...(name === undefined || name === "" ? {} : { function: name }),
      filename: match[2] ?? match[6] ?? "<unknown>",
      lineno: Number(match[3] ?? match[7]),
      colno: Number(match[4] ?? match[8]),
    });
  }
  return frames;
}

/**
 * The envelope of `error`.
 *
 * @example
 * await fetch(target.endpoint, { method: "POST", body: sentryEnvelope(error, { eventId, at, dsn, environment: "production", release: "" }) });
 */
export function sentryEnvelope(error: unknown, report: Report): string {
  const known = error instanceof Error;
  const frames = known ? framesOf(error.stack) : [];
  const event = {
    event_id: report.eventId,
    timestamp: report.at.getTime() / 1000,
    platform: "javascript",
    level: "error",
    ...(report.environment === "" ? {} : { environment: report.environment }),
    ...(report.release === "" ? {} : { release: report.release }),
    ...(isRefusal(error) ? { tags: { code: error.code } } : {}),
    exception: {
      values: [
        {
          type: known ? error.name : typeof error,
          value: known ? error.message : `a thrown ${typeof error}`,
          ...(frames.length === 0 ? {} : { stacktrace: { frames } }),
        },
      ],
    },
  };
  return [
    JSON.stringify({ event_id: report.eventId, sent_at: report.at.toISOString(), dsn: report.dsn }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");
}

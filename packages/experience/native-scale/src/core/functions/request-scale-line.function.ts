/**
 * Stackra file contract:
 * Purpose: `requestScaleLine`, which writes a command (or nothing, for a scale that streams) and waits for the first
 *          line the parser reads as a weight, tare or fault that `accept` takes, or null after the timeout or when
 *          the write fails.
 * Boundary: internal; not exported from the entry. It subscribes before writing so a fast answer is not missed, and
 *           always unsubscribes and clears its timer. Lines `accept` refuses are skipped, not errors.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5).
 */
import { listenScaleLines } from "#core/functions/listen-scale-lines.function";
import type { NativeScaleModule } from "#core/types/native-scale-module.type";
import type { ScaleLine } from "#core/types/scale-line.type";

/** What a request needs. */
interface ScaleRequest<T extends ScaleLine> {
  /** The command without its terminator, or empty to only listen. */
  readonly command: string;
  /** The protocol's line terminator. */
  readonly terminator: string;
  /** The protocol's parser. */
  readonly parse: (line: string) => ScaleLine | null;
  /** Which parsed lines answer the request. */
  readonly accept: (line: ScaleLine) => line is T;
  /** How long to wait, in milliseconds. */
  readonly timeout: number;
}

/**
 * The answering line, or null.
 *
 * @example
 * const line = await requestScaleLine(module, { command: "SI", terminator: "\r\n", parse: parseMtSicsLine, accept: isWeightOrFault, timeout: 2000 });
 */
export function requestScaleLine<T extends ScaleLine>(
  module: NativeScaleModule,
  request: ScaleRequest<T>,
): Promise<T | null> {
  return new Promise((resolve) => {
    let isDone = false;
    const stop = listenScaleLines(module, request.terminator, (text) => {
      const line = request.parse(text);
      if (line !== null && request.accept(line)) finish(line);
    });
    const timer = setTimeout(() => finish(null), request.timeout);
    /** Settles once: clears the timer, unsubscribes and resolves. */
    function finish(line: T | null): void {
      if (isDone) return;
      isDone = true;
      clearTimeout(timer);
      stop();
      resolve(line);
    }
    if (request.command !== "")
      module.write(request.command + request.terminator).catch(() => finish(null));
  });
}

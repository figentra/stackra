/**
 * Stackra file contract:
 * Purpose: `listenScaleLines`, which subscribes to the module's `onData` chunks and hands each complete line (split on
 *          the protocol's terminator, the terminator removed) to a listener.
 * Boundary: internal; not exported from the entry. Each subscription keeps its own buffer, capped at 1 KiB so a scale
 *           that never sends the terminator cannot grow it; a chunk that is not a string is dropped. Where the module
 *           is absent the subscription does nothing. Lines are never stored past the buffer.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5: framing stays in the TypeScript driver).
 */
import type { NativeScaleModule } from "#core/types/native-scale-module.type";

/** The longest partial line kept. */
const MAX_BUFFER = 1024;

/**
 * Calls `listener` with each line; the returned function stops it.
 *
 * @example
 * const stop = listenScaleLines(module, "\r\n", (line) => lines.push(line));
 */
export function listenScaleLines(
  module: NativeScaleModule | undefined,
  terminator: string,
  listener: (line: string) => void,
): () => void {
  let buffer = "";
  const subscription = module?.addListener("onData", (event) => {
    if (typeof event.text !== "string") return;
    buffer += event.text;
    let end = buffer.indexOf(terminator);
    while (end !== -1) {
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + terminator.length);
      if (line.length > 0) listener(line);
      end = buffer.indexOf(terminator);
    }
    if (buffer.length > MAX_BUFFER) buffer = "";
  });
  return () => subscription?.remove();
}

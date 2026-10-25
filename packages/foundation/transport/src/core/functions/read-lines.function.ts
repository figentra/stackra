/**
 * Stackra file contract:
 * Purpose: `readLines`, the line reader under `readNdjson` and `readServerSentEvents`: decodes a response body as
 *          UTF-8 while it streams and yields each line as it completes.
 * Boundary: internal. Splits on `\r\n`, `\n` and `\r`, also when a break falls across two chunks; the last line is
 *           yielded even without a final break. A body without a stream (an older fetch) is read whole. When the
 *           consumer stops early, or the read fails, the body stream is cancelled so the connection is freed.
 * Runtime: isomorphic
 * Governing contract: the WHATWG event-stream line rules; NDJSON (newline-delimited JSON).
 */

/** The first line break: CRLF before a lone CR or LF. */
const LINE_BREAK = /\r\n|\r|\n/;

/**
 * The lines of `response`'s body.
 *
 * @yields Each line, without its line break.
 * @example
 * for await (const line of readLines(response)) console.info(line);
 */
export async function* readLines(response: Response): AsyncGenerator<string> {
  if (response.body === null) {
    yield* complete(await response.text());
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;
  try {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      buffer += decoder.decode(chunk.value, { stream: true });
      const [lines, rest] = split(buffer, false);
      buffer = rest;
      yield* lines;
    }
    finished = true;
    yield* complete(buffer + decoder.decode());
  } finally {
    if (!finished) await reader.cancel().catch(() => undefined);
  }
}

/** Every line of `text`, the unterminated tail included. */
function complete(text: string): string[] {
  const [lines, rest] = split(text, true);
  return rest === "" ? lines : [...lines, rest];
}

/** The complete lines of `text` and the rest. Unless `final`, a CR at the very end waits: it may start a CRLF. */
function split(text: string, final: boolean): [lines: string[], rest: string] {
  const lines: string[] = [];
  let rest = text;
  for (let match = LINE_BREAK.exec(rest); match !== null; match = LINE_BREAK.exec(rest)) {
    if (!final && match[0] === "\r" && match.index === rest.length - 1) break;
    lines.push(rest.slice(0, match.index));
    rest = rest.slice(match.index + match[0].length);
  }
  return [lines, rest];
}

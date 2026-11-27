/**
 * Stackra file contract:
 * Purpose: `readCappedBody`, reads a request body stream to bytes, stopping as soon as it passes `max` or `signal`
 *          aborts (the body read deadline, STA-1467).
 * Boundary: resolves undefined when the body is larger than `max`, and rejects with the signal's reason once it
 *           aborts, even while a chunk is still awaited; it never cancels the stream, so the Node server still answers
 *           on the open connection and dumps the rest of the upload itself. Pure over the stream.
 * Runtime: node
 * Governing contract: ADR 0237 (STA-2577 note: the body is read once, under a cap, before any guard); STA-1467 (a
 *                     slow upload never holds a load-shedding place past the deadline).
 */

/**
 * The bytes of `body`, or undefined when they pass `max`.
 *
 * @param body - the request's body stream, or null for a bodyless request.
 * @param max - the largest size in bytes.
 * @param signal - aborts the read (the body read deadline); the read then rejects with its reason.
 * @throws the signal's reason (as a rejection) once it aborts before the body arrived in full.
 * @example
 * const bytes = await readCappedBody(request.body, 1_048_576, deadline.signal); // undefined: answer 413
 */
export async function readCappedBody(
  body: ReadableStream<Uint8Array> | null,
  max: number,
  signal?: AbortSignal,
): Promise<Uint8Array | undefined> {
  if (body === null) return new Uint8Array();
  signal?.throwIfAborted();
  const reader = body.getReader();
  let onAbort: (() => void) | undefined;
  // Settles only by rejecting, once the signal aborts; races every chunk so a stalled one cannot outlast it.
  const aborted =
    signal === undefined
      ? undefined
      : new Promise<never>((_resolve, reject) => {
          onAbort = () => {
            reject(signal.reason as Error);
          };
          signal.addEventListener("abort", onAbort, { once: true });
        });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await (aborted === undefined
        ? reader.read()
        : Promise.race([reader.read(), aborted]));
      if (done) break;
      size += value.byteLength;
      if (size > max) return undefined;
      chunks.push(value);
    }
  } finally {
    if (onAbort !== undefined) signal?.removeEventListener("abort", onAbort);
  }
  return Buffer.concat(chunks);
}

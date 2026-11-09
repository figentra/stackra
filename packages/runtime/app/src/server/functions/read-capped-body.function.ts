/**
 * Stackra file contract:
 * Purpose: `readCappedBody`, reads a request body stream to bytes, stopping as soon as it passes `max`.
 * Boundary: resolves undefined when the body is larger than `max`; it never cancels the stream, so the Node server
 *           still answers on the open connection and dumps the rest of the upload itself. Pure over the stream.
 * Runtime: node
 * Governing contract: ADR 0237 (STA-2577 note: the body is read once, under a cap, before any guard).
 */

/**
 * The bytes of `body`, or undefined when they pass `max`.
 *
 * @param body - the request's body stream, or null for a bodyless request.
 * @param max - the largest size in bytes.
 * @example
 * const bytes = await readCappedBody(request.body, 1_048_576); // undefined: answer 413
 */
export async function readCappedBody(
  body: ReadableStream<Uint8Array> | null,
  max: number,
): Promise<Uint8Array | undefined> {
  if (body === null) return new Uint8Array();
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) return undefined;
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

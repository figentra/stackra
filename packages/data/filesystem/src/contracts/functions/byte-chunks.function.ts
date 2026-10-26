/**
 * Stackra file contract:
 * Purpose: `byteChunks(source)`, the chunks of a `WriteStreamSource` as byte arrays, in order: a string chunk is
 *          encoded as UTF-8, an empty chunk is skipped.
 * Boundary: internal to the package (not re-exported): the port's buffered `writeStream` and the S3 multipart upload
 *           read through it. A `ReadableStream` is read with its reader, so it works where the stream is not async
 *           iterable, and its lock is released when the loop ends early or throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0413 (streamed writes).
 */
import type { WriteStreamSource } from "#contracts/types/write-stream-source.type";

/**
 * Yields the bytes of `source`.
 *
 * @yields The source's bytes, chunk by chunk.
 * @example
 * for await (const chunk of byteChunks(response.body)) total += chunk.byteLength;
 */
export async function* byteChunks(source: WriteStreamSource): AsyncGenerator<Uint8Array> {
  const encoder = new TextEncoder();
  // Duck-typed, so a stream from another realm (a worker, an SDK's own polyfill) is read as one.
  if ("getReader" in source) {
    const reader = source.getReader();
    try {
      for (let next = await reader.read(); !next.done; next = await reader.read())
        if (next.value.byteLength > 0) yield next.value;
    } finally {
      reader.releaseLock();
    }
    return;
  }
  for await (const chunk of source) {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
    if (bytes.byteLength > 0) yield bytes;
  }
}

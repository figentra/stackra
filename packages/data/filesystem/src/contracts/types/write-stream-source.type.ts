/**
 * Stackra file contract:
 * Purpose: `WriteStreamSource`, what `FileSystem.writeStream` reads: a web `ReadableStream` of bytes (a `fetch` body, a
 *          `CompressionStream` output) or any async iterable of byte or UTF-8 string chunks (an async generator that
 *          builds an export row by row, a Node `Readable`).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0413 (streamed writes); ADR 0234 (decision 7); ADR 0294 (decision 15).
 */

/** A source of file contents read chunk by chunk. */
export type WriteStreamSource = ReadableStream<Uint8Array> | AsyncIterable<Uint8Array | string>;

/**
 * Stackra file contract:
 * Purpose: `TabularSource`, the bytes of a file a reader consumes: a Node `Readable`, a web stream read as an async
 *          iterable, an upload's chunks, or an array of chunks in a test.
 * Boundary: a type only; a reader iterates it once and never holds the whole file.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 2).
 */

/** The chunks of one file, in order. */
export type TabularSource = AsyncIterable<Uint8Array> | Iterable<Uint8Array>;

/**
 * Stackra file contract:
 * Purpose: `concatBytes(chunks)`, one new byte array holding `chunks` end to end.
 * Boundary: internal to the package (not re-exported); isomorphic, so it uses no `Buffer`.
 * Runtime: isomorphic
 * Governing contract: ADR 0413 (streamed writes).
 */

/**
 * The bytes of `chunks`, joined.
 *
 * @example
 * concatBytes([new Uint8Array([1]), new Uint8Array([2, 3])]); // Uint8Array [1, 2, 3]
 */
export function concatBytes(chunks: readonly Uint8Array[]): Uint8Array {
  const bytes = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

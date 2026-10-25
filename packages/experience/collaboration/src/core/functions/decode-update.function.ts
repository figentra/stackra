/**
 * Stackra file contract:
 * Purpose: `decodeUpdate(data)`, the bytes of a room `update` message's base64 text, or `undefined` when it is not
 *          base64 text.
 * Boundary: pure; never throws, so one malformed frame from a peer is dropped instead of breaking the stream.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decision 4).
 */

/**
 * Decodes an update.
 *
 * @example
 * decodeUpdate("AAE="); // Uint8Array [0, 1]
 */
export function decodeUpdate(data: unknown): Uint8Array | undefined {
  if (typeof data !== "string") return undefined;
  try {
    return Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
  } catch {
    return undefined;
  }
}

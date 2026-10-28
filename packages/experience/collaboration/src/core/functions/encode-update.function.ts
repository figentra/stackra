/**
 * Stackra file contract:
 * Purpose: `encodeUpdate(update)`, a CRDT update as the base64 text a room `update` message carries (JSON has no
 *          bytes).
 * Boundary: pure; standard base64 with padding, so any runtime's `atob` decodes it.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decision 4: `update`, a Yjs update, as bytes).
 */

/**
 * Encodes an update.
 *
 * @example
 * encodeUpdate(new Uint8Array([0, 1])); // "AAE="
 */
export function encodeUpdate(update: Uint8Array): string {
  let text = "";
  for (const byte of update) text += String.fromCodePoint(byte);
  return btoa(text);
}

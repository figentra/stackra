/**
 * Stackra file contract:
 * Purpose: `decodeBase64`, standard base64 text (whitespace and line breaks ignored) to bytes, for the licence file's
 *          body, signature and cipher parts.
 * Boundary: internal; not exported from the entry. Built on `atob`, present in Node, browsers and workers.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decision 1).
 */

/**
 * Decodes base64 text to bytes.
 *
 * @example
 * decodeBase64("aGk="); // Uint8Array [104, 105]
 * @throws DOMException (`InvalidCharacterError`) when `text` is not base64.
 */
export function decodeBase64(text: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(text.replace(/\s+/g, "")), (character) => character.charCodeAt(0));
}

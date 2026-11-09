/**
 * Stackra file contract:
 * Purpose: `derElement`, one DER element (tag, definite length, contents) from already encoded parts.
 * Boundary: a pure function; definite lengths only, as DER requires. Callers pass encoded children, so it never
 *           interprets them.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4).
 */

/**
 * The element `tag` holding `parts` in order.
 *
 * @example
 * derElement(0x04, new Uint8Array([1, 2])); // OCTET STRING: 04 02 01 02
 */
export function derElement(tag: number, ...parts: readonly Uint8Array[]): Uint8Array {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const length: number[] = [];
  if (size < 0x80) length.push(size);
  else {
    for (let rest = size; rest > 0; rest = Math.floor(rest / 256)) length.unshift(rest % 256);
    length.unshift(0x80 | length.length);
  }
  const out = new Uint8Array(1 + length.length + size);
  out[0] = tag;
  out.set(length, 1);
  let at = 1 + length.length;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

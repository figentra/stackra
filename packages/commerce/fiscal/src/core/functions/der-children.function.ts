/**
 * Stackra file contract:
 * Purpose: `derChildren`, the encoded children of one constructed DER element (a SEQUENCE, a SET, a context tag), each
 *          as its own whole element: tag, length and contents.
 * Boundary: a pure function; single-byte tags and definite lengths only (all a certificate uses). Malformed input
 *           returns `null` instead of throwing, so the caller decides which refusal it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4).
 */

/**
 * The children of the element at the start of `element`, or `null` when it does not parse.
 *
 * @example
 * derChildren(new Uint8Array([0x30, 0x03, 0x02, 0x01, 0x05])); // [02 01 05]
 */
export function derChildren(element: Uint8Array): Uint8Array[] | null {
  /** Where the contents of the element that starts at `at` begin and where it ends; `null` when it overruns. */
  const endOf = (at: number): [contents: number, end: number] | null => {
    const first = element[at + 1];
    if (first === undefined) return null;
    let length = first;
    let contents = at + 2;
    if (first & 0x80) {
      const count = first & 0x7f;
      if (count === 0 || count > 4) return null;
      length = 0;
      for (let index = 0; index < count; index += 1) {
        const byte = element[contents + index];
        if (byte === undefined) return null;
        length = length * 256 + byte;
      }
      contents += count;
    }
    const end = contents + length;
    return end <= element.length ? [contents, end] : null;
  };
  const outer = endOf(0);
  if (outer === null) return null;
  const children: Uint8Array[] = [];
  for (let at = outer[0]; at < outer[1];) {
    const child = endOf(at);
    if (child === null || child[1] > outer[1]) return null;
    children.push(element.subarray(at, child[1]));
    at = child[1];
  }
  return children;
}

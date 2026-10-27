/**
 * Stackra file contract:
 * Purpose: `splitEdi(text, separator, release, unescape)`, splits EDI text on one delimiter while honouring the
 *          EDIFACT release character, so an escaped `+`, `:` or `'` stays inside its value.
 * Boundary: internal to the envelope readers; not exported from the barrel. X12 passes no release character.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); ISO 9735 (release character).
 */

/**
 * The parts of `text` between `separator`s.
 *
 * @param release - the release character, or undefined when the syntax has none.
 * @param unescape - drop each release character from the parts (the last split level only).
 * @example
 * splitEdi("A?+B+C", "+", "?", true); // ["A+B", "C"]
 */
export function splitEdi(
  text: string,
  separator: string,
  release: string | undefined,
  unescape = false,
): string[] {
  const parts: string[] = [];
  let current = "";
  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    if (char === release && index + 1 < text.length) {
      current += unescape ? text.charAt(index + 1) : char + text.charAt(index + 1);
      index += 1;
    } else if (char === separator) {
      parts.push(current);
      current = "";
    } else current += char;
  }
  parts.push(current);
  return parts;
}

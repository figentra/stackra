/**
 * Stackra file contract:
 * Purpose: `xmlText`, the text of an XML character run: the five named entities and numeric references decoded.
 * Boundary: pure; internal to the XLSX reader. Takes the run between tags, never markup.
 * Runtime: node
 * Governing contract: ADR 0367 (decision 2).
 */

const NAMED: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/**
 * The decoded text of `raw`.
 *
 * @example
 * xmlText("a &amp; b &#x41;"); // "a & b A"
 */
export function xmlText(raw: string): string {
  return raw.replaceAll(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity: string, name: string) => {
    if (name.startsWith("#x") || name.startsWith("#X"))
      return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
    if (name.startsWith("#")) return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
    return NAMED[name] ?? entity;
  });
}

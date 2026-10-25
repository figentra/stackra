/**
 * Stackra file contract:
 * Purpose: `serializeJsonLd`, the escaper of structured data: one JSON-LD block as the text of a
 *          `<script type="application/ld+json">` element, with `@context` added when the block leaves it out.
 * Boundary: `<`, `>` and `&` become JSON unicode escapes, so no value can close the script element, open a comment or
 *           start markup; U+2028 and U+2029 are escaped too. The result parses back to the same JSON. Values JSON
 *           cannot carry follow `JSON.stringify` (an `undefined` field is dropped; a bigint throws).
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 4).
 */
import type { JsonLd } from "#core/types/json-ld.type";

/** The escape of each character that could end the script element or break a parser. */
const ESCAPES: Readonly<Record<string, string>> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

/**
 * `block` as safe script-element text.
 *
 * @example
 * serializeJsonLd({ "@type": "Organization", name: "</script><script>alert(1)" });
 * // every `<` and `>` comes out as a JSON unicode escape, so the text holds no `</script>`
 * @throws TypeError when the block holds a value JSON cannot serialise (a bigint, a cycle).
 */
export function serializeJsonLd(block: JsonLd): string {
  const withContext = "@context" in block ? block : { "@context": "https://schema.org", ...block };
  return JSON.stringify(withContext).replace(
    /[<>&\u2028\u2029]/g,
    (character) => ESCAPES[character] ?? character,
  );
}

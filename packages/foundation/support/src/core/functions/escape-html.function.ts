/**
 * Stackra file contract:
 * Purpose: `escapeHtml`, text made safe for HTML content and quoted attribute values: `&`, `<`, `>`, `"` and `'`
 *          become entities; `null` and `undefined` are `""`.
 * Boundary: public and pure, no DOM and no Node API, so it runs in a Worker. Document text and data values are
 *           tenant content and never markup.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0110 (decision 4); ADR 0154; ADR 0365 (decision 2);
 *                     stackra-224 (one copy, was documents and experience).
 */

/** The entity of each character HTML gives meaning to. */
const ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * `value` as text safe inside HTML.
 *
 * @example
 * `<h1>${escapeHtml(props.title)}</h1>`;
 * escapeHtml('<a href="x">'); // "&lt;a href=&quot;x&quot;&gt;"
 */
export function escapeHtml(value: unknown): string {
  return value === null || value === undefined
    ? ""
    : String(value).replace(/[&<>"']/g, (character) => ENTITIES[character] ?? character);
}

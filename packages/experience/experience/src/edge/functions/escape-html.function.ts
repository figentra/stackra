/**
 * Stackra file contract:
 * Purpose: `escapeHtml`, text made safe for HTML content and quoted attribute values: `&`, `<`, `>`, `"` and `'`
 *          become entities.
 * Boundary: pure, no DOM and no Node API, so it runs in a Worker. Every edge block writes its props through it;
 *           document text is tenant content and never markup (ADR 0110 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0440; ADR 0110 (decision 4); ADR 0154.
 */

const ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * `value` as text safe inside HTML; `null` and `undefined` are `""`.
 *
 * @example
 * `<h1>${escapeHtml(props.title)}</h1>`;
 */
export function escapeHtml(value: unknown): string {
  return value === null || value === undefined
    ? ""
    : String(value).replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}

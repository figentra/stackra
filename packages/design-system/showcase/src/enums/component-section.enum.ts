/**
 * Stackra file contract:
 * Purpose: `ComponentSection`, the fifteen sections of a component page in order; headings are `showcase::section.<id>`.
 * Boundary: the values only; both platforms render this order.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 4; ADR 0305 (one declaration per file).
 */

/** The component page sections, in page order. */
export const ComponentSection = Object.freeze([
  "header",
  "links",
  "import",
  "usage",
  "anatomy",
  "guidance",
  "examples",
  "playground",
  "styling",
  "accessibility",
  "rtl",
  "api",
  "stackra",
  "related",
  "pager",
] as const);

/** One component page section. */
export type ComponentSection = (typeof ComponentSection)[number];

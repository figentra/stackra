/**
 * Stackra file contract:
 * Purpose: `EMPTY_DOC`, the `ApiDoc` of a declaration that has no TSDoc comment.
 * Boundary: a constant only.
 * Runtime: node
 * Governing contract: ADR 0007 (docblock standard); STA-2857.
 */
import type { ApiDoc } from "#scripts/api-reference/api-doc.type";

/** The doc of a declaration that has no comment. */
export const EMPTY_DOC: ApiDoc = {
  summary: "",
  params: [],
  typeParams: [],
  throws: [],
  examples: [],
  see: [],
  internal: false,
};

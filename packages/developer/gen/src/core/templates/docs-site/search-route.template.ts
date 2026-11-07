/**
 * Stackra file contract:
 * Purpose: `SEARCH_ROUTE_TEMPLATE`, the `app/routes/search.ts` of a generated Fumadocs site: the Orama search index
 *          of every page, prerendered to the static file `/api/search` the browser searches.
 * Boundary: a constant; no search service and no runtime (ADR 0514; research R6).
 * Runtime: isomorphic
 * Governing contract: ADR 0514; STA-2026.
 */

/** The emitted `app/routes/search.ts`. */
export const SEARCH_ROUTE_TEMPLATE = `import { createFromSource } from "fumadocs-core/search/server";

import { source } from "../lib/source";

const server = createFromSource(source, { language: "english" });

export function loader() {
  return server.staticGET();
}
`;

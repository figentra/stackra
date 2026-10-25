/**
 * Stackra file contract:
 * Purpose: `registerDocumentResolver(resolve)`, how the package that owns documents makes a route's `document:` class
 *          load the tenant's published version (through its document query) instead of the coded class.
 * Boundary: writes `ROUTE_DOCUMENTS`; one resolver per process, a later registration replacing it. Returns the
 *           disposer that restores the coded class.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (documents); ADR 0114 (page builder); ADR 0154 (documents reference registered code).
 */
import { ROUTE_DOCUMENTS } from "#core/constants/route-documents.constant";
import type { DocumentResolver } from "#core/types/document-resolver.type";

/**
 * Makes `resolve` the document resolver of every document route.
 *
 * @example
 * registerDocumentResolver(async (document, ctx) => (await ctx.query(GetDocumentQuery, { key: keyOf(document) })) ?? document);
 */
export function registerDocumentResolver(resolve: DocumentResolver): () => void {
  ROUTE_DOCUMENTS.resolve = resolve;
  return () => {
    if (ROUTE_DOCUMENTS.resolve === resolve) ROUTE_DOCUMENTS.resolve = null;
  };
}

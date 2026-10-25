/**
 * Stackra file contract:
 * Purpose: `ROUTE_DOCUMENTS`, the one slot holding the registered `DocumentResolver`.
 * Boundary: internal process state; written by `registerDocumentResolver`, read by `loadRoute`.
 * Runtime: isomorphic
 * Governing contract: ADR 0110; ADR 0114.
 */
import type { DocumentResolver } from "#core/types/document-resolver.type";

/** The registered resolver, or `null` for the coded class. */
export const ROUTE_DOCUMENTS: { resolve: DocumentResolver | null } = { resolve: null };

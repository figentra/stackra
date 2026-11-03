/**
 * Stackra file contract:
 * Purpose: `PanelDocumentPage`, one panel document as the panel mounts it: its route constant (`document(key, options)`)
 *          and its `Document({ kind, blocks })` class.
 * Boundary: a type only; gen hands the list to `registerPanelPages({ documents })`, and the panel route of the route's
 *           panel mounts each at its path and lists it in the navigation when it declares an entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 20); ADR 0164; build-list item 53 (STA-1981).
 */
import type { AnyClass } from "@stackra/container";

import type { DocumentRoute } from "#core/types/document-route.type";

/** A document and its route. */
export interface PanelDocumentPage {
  /** The route constant (`Resources.SalesOverview`). */
  readonly route: DocumentRoute;

  /** The `Document({ ... })` class. */
  readonly document: AnyClass;
}

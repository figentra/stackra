/**
 * Stackra file contract:
 * Purpose: `DocumentRoute`, what `document(key, options)` returns: the document's route constant inside its panel.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 20); ADR 0164; owner decision R-56.
 */
import type { PageRef } from "#core/types/page-ref.type";
import type { PanelRef } from "#core/types/panel-ref.type";

/** A document's route constant. */
export interface DocumentRoute extends PageRef {
  /** The document key (`orders.sales_overview`). */
  readonly key: string;

  /** The panel it is mounted in. */
  readonly panel: PanelRef;

  /** The permission the page needs. */
  readonly permission?: string;
}

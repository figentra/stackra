/**
 * Stackra file contract:
 * Purpose: `DocumentRouteOptions`, the second argument of `document(key, options)` in the generated `#stackra/resources`:
 *          the document's path inside its panel, the panel and the permission.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 20); ADR 0164.
 */
import type { PanelRef } from "#core/types/panel-ref.type";

/** What a document's route constant is built from. */
export interface DocumentRouteOptions {
  /** The path inside the panel (`/sales`). */
  readonly path: string;

  /** The panel hosting the document's area. */
  readonly panel: PanelRef;

  /** The permission the page needs: the read permission its tiles' queries share. */
  readonly permission?: string;
}

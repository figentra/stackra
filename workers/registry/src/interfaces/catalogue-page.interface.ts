/**
 * Stackra file contract:
 * Purpose: `CataloguePage`: one page of the catalogue, newest publish first.
 * Boundary: types and the kinds list only. Stand-in: ADR 0453 names `@stackra/skills/contracts` as the home of these
 *           shapes (stackra-184, not built yet); when it lands, the Worker imports them from there and these local
 *           copies go.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 11 and 12).
 */
import type { CatalogueItem } from "#src/interfaces/catalogue-item.interface";

/** One page of the catalogue, newest publish first. */
export interface CataloguePage {
  /** The catalogue entries on this page. */
  readonly items: readonly CatalogueItem[];
  /** The opaque cursor of the next page, or null on the last page. */
  readonly next: string | null;
}

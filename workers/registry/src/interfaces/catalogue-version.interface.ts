/**
 * Stackra file contract:
 * Purpose: `CatalogueVersion`: one version in a catalogue item.
 * Boundary: types and the kinds list only. Stand-in: ADR 0453 names `@stackra/skills/contracts` as the home of these
 *           shapes (stackra-184, not built yet); when it lands, the Worker imports them from there and these local
 *           copies go.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 11 and 12).
 */

/** One version in a catalogue item. */
export interface CatalogueVersion {
  readonly version: string;
  readonly publishedAt: string;
  readonly deprecated: string | null;
}

/**
 * Stackra file contract:
 * Purpose: `CatalogueVersion`: one version in a catalogue item.
 * Boundary: types and the kinds list only. Stand-in: ADR 0453 names `@stackra/skills/contracts` as the home of these
 *           shapes (stackra-184, not built yet); when it lands, the Worker imports them from there and these local
 *           copies go.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 11 and 12).
 */

/** One version in a catalogue item. */
export interface CatalogueVersion {
  /** The semver version string. */
  readonly version: string;
  /** When the version was published, as an ISO 8601 timestamp. */
  readonly publishedAt: string;
  /** The deprecation message of the version, or null when it is not deprecated. */
  readonly deprecated: string | null;
}

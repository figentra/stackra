/**
 * Stackra file contract:
 * Purpose: `LoadCatalogue`, the lazy loader gen writes per namespace and locale in `#stackra/i18n`:
 *          `() => import("#assets/lang/ar-SA/web.json")`.
 * Boundary: type only; a loader exists only for a file that exists, so a regional overlay without a file has none.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (as amended by 0305 conventions 1), ADR 0234.
 */
import type { Catalogue } from "#core/types/catalogue.type";

/** Imports one lang file; the catalogue is the module's default export. */
export type LoadCatalogue = () => Promise<{ readonly default: Catalogue }>;

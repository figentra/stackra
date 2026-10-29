/**
 * Stackra file contract:
 * Purpose: `BrowseLocale`: a locale of the registry browser; English has no path prefix, Arabic is `/ar/`.
 * Boundary: type only.
 * Runtime: worker
 * Governing contract: ADR 0453; ADR 0297 (decision 4: the URL alone selects the locale).
 */

/** A locale of the registry browser. */
export type BrowseLocale = "en" | "ar";

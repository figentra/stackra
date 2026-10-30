/**
 * Stackra file contract:
 * Purpose: `localePath`: a browser path in a locale: English unprefixed, Arabic under `/ar`.
 * Boundary: pure.
 * Runtime: worker
 * Governing contract: ADR 0453; ADR 0297 (decision 4).
 */
import type { BrowseLocale } from "#src/interfaces/browse-locale.type";

/**
 * A browser path in a locale.
 *
 * @example
 * localePath("ar", "/package/@stackra/core"); // "/ar/package/@stackra/core"
 * localePath("ar", "/"); // "/ar/"
 */
export const localePath = (locale: BrowseLocale, path: string): string =>
  locale === "en" ? path : `/${locale}${path}`;

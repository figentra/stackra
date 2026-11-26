/**
 * Stackra file contract:
 * Purpose: `PRO_PACKAGES`, the `@stackra-pro/*` packages for sale, as ADR 0461 decision 2 lists them: four studios
 *          over free runtimes and three drivers behind free ports. The customer page "Free and Pro" must name each of
 *          them and no other Pro package.
 * Boundary: data only. The source of the packages is the private stackra-pro repository; this list changes only with
 *           an ADR that changes the Pro line (0461), in the same pull request.
 * Runtime: node
 * Governing contract: ADR 0461 (decision 2, amended by 0469: no `@stackra-pro/ui`); STA-2865.
 */

/** The Pro packages ADR 0461 decision 2 puts on sale, sorted. */
export const PRO_PACKAGES: readonly string[] = [
  "@stackra-pro/ai-studio",
  "@stackra-pro/analytics-destinations",
  "@stackra-pro/builder-studio",
  "@stackra-pro/devtools",
  "@stackra-pro/notifications-studio",
  "@stackra-pro/search-meilisearch",
  "@stackra-pro/search-opensearch",
];

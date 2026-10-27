/**
 * Stackra file contract:
 * Purpose: `VERSION_SUPPORT_MONTHS`, the default support window of a dated version: the calendar months it is still
 *          served, with `Deprecation` and `Sunset`, after its successor ships.
 * Boundary: a default only. The service's versioning config passes its own `supportMonths` to `resolveVersion`
 *           (configuration, not code); this value seeds that setting and applies when it is left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decision 4: supported for 12 months after its successor ships); ADR 0136 (at least
 *                     6 months for public APIs); OS-376 (`sdks.deprecationMonths`, seeded 12).
 */

/** Calendar months an older dated version stays served after its successor ships. */
export const VERSION_SUPPORT_MONTHS = 12;

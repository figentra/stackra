/**
 * Stackra file contract:
 * Purpose: `INVARIANT_PLURALS`, the last words `plural` leaves as they are because they are already plural or have no
 *          separate plural (`opening_hours`, `news`, `series`, `settings`, `analytics`), so a model named after one keeps
 *          that word in its table name and path.
 * Boundary: a frozen set of lowercase words, matched against the last word of a snake_case name only. Only words that
 *           end in `s` belong here: one that does not already gets a regular plural. A regular noun that ends in `s`
 *           (`address`, `class`, `bus`) never belongs here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 21: snake_case plural tables, plural URL paths).
 */

/** Last words that are their own plural. */
export const INVARIANT_PLURALS: ReadonlySet<string> = new Set([
  "analytics",
  "credentials",
  "details",
  "economics",
  "ethics",
  "goods",
  "headquarters",
  "hours",
  "logistics",
  "means",
  "metrics",
  "news",
  "odds",
  "preferences",
  "premises",
  "series",
  "settings",
  "species",
  "statistics",
  "thanks",
]);

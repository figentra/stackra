/**
 * Stackra file contract:
 * Purpose: `SEARCH_PRESENCE_FIELDS`, the fields whose change decides whether a row is in a session's index at all
 *          (soft delete, archive and the row's scope), so a change of one of them is never skipped as untouched.
 * Boundary: field names as a `RowChange` carries them (the model's property names), the traits' own fields.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 5); ADR 0327 (a scope is an id and an `ltree` path); data-layer gap se3.
 */

/** Fields that can add a row to an index or take it out. */
export const SEARCH_PRESENCE_FIELDS: ReadonlySet<string> = new Set([
  "deletedAt",
  "archivedAt",
  "scopeId",
  "scopePath",
]);

/**
 * Stackra file contract:
 * Purpose: `PUBLIC_ID_TEXT`, the text column type of a public id: `varchar(33)`, which fits a 6-letter prefix, `_`
 *          and 26 characters.
 * Boundary: internal to the migration compiler. Principal stamps (`created_by`, `updated_by`) and `scope_id` always use
 *           it, since they hold ids of several prefixes or compare with a text setting; a key column uses it unless
 *           the member compiles with `publicIds: "uuid"` (ADR 0135, 2026-10-28 amendment).
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (decision 1 and the 2026-10-28 amendment).
 */

/** `varchar(33)`. */
export const PUBLIC_ID_TEXT = "varchar(33)";

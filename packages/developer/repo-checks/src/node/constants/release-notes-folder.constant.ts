/**
 * Stackra file contract:
 * Purpose: `RELEASE_NOTES_FOLDER`, the repository-relative folder of the upgrade notes: one `.mdx` page per release
 *          line, `0-<minor>.mdx` before 1.0.0 and `<major>.mdx` after, served at `/customers/upgrading/<line>`.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0013 (decision 5); STA-2835.
 */

/** Where the upgrade notes live. */
export const RELEASE_NOTES_FOLDER = "apps/docs/src/docs/customers/upgrading";

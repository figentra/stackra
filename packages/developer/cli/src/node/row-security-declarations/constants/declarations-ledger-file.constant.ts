/**
 * Stackra file contract:
 * Purpose: `DECLARATIONS_LEDGER_FILE`, the committed review list of every `t.platformTable` and `t.reviewedPolicy`
 *          declaration in the repository's migrations, with its reason, that `stackra row-security-declarations`
 *          holds the migrations to.
 * Boundary: data only; a repository-relative path.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, group (c) table); ADR 0347 (decision 5).
 */

/** The review list the declarations are checked against. */
export const DECLARATIONS_LEDGER_FILE = "tools/scripts/row-security-declarations.yaml";

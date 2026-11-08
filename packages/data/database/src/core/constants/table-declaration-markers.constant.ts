/**
 * Stackra file contract:
 * Purpose: `TABLE_DECLARATION_MARKERS`, the comment lines a compiled migration carries for `t.platformTable(reason)`
 *          and `t.reviewedPolicy(reason, policies)`: `-- stackra:platform-table <schema>.<table> <reason>` and
 *          `-- stackra:reviewed-policy <schema>.<table> <policy>[,<policy>] <reason>`. `tableDeclarations` reads them
 *          back, so the row-security audit and gen's isolation test see what the migration declared.
 * Boundary: data only. A marker is a SQL comment: it changes nothing in the database, and a frozen migration that
 *           never declared one keeps its checksum.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (2026-11-07 amendment, group (c) table); ADR 0159 (compiled migrations, the
 *                     `-- stackra:` header lines).
 */

/** The comment prefix of each declaration in a compiled migration. */
export const TABLE_DECLARATION_MARKERS = {
  platformTable: "-- stackra:platform-table",
  reviewedPolicy: "-- stackra:reviewed-policy",
} as const;

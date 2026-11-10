/**
 * Stackra file contract:
 * Purpose: `TABLE_DECLARATION_MARKERS`, the comment lines a compiled migration carries for `t.platformTable(reason)`,
 *          `t.reviewedPolicy(reason, policies)`, `t.systemAccess(options)` and `schema.systemFunction(options)`:
 *          `-- stackra:platform-table <schema>.<table> <reason>`,
 *          `-- stackra:reviewed-policy <schema>.<table> <policy>[,<policy>] <reason>`,
 *          `-- stackra:system-access <schema>.<table> select=<column>[,<column>] [update=<column>[,<column>]] <reason>`
 *          and `-- stackra:system-function <schema>.<function> <reason>`. `tableDeclarations` reads them back, so the
 *          row-security audit and gen's isolation test see what the migration declared.
 * Boundary: data only. A marker is a SQL comment: it changes nothing in the database, and a frozen migration that
 *           never declared one keeps its checksum.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (2026-11-07 amendment, group (c) table and gap A); ADR 0159 (compiled migrations, the
 *                     `-- stackra:` header lines).
 */

/** The comment prefix of each declaration in a compiled migration. */
export const TABLE_DECLARATION_MARKERS = {
  /** The marker `t.platformTable(reason)` writes. */
  platformTable: "-- stackra:platform-table",
  /** The marker `t.reviewedPolicy(reason, policies)` writes. */
  reviewedPolicy: "-- stackra:reviewed-policy",
  /** The marker `t.systemAccess(options)` writes. */
  systemAccess: "-- stackra:system-access",
  /** The marker `schema.systemFunction(options)` writes. */
  systemFunction: "-- stackra:system-function",
} as const;

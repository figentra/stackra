/**
 * Stackra file contract:
 * Purpose: `COMMITTED_SQL_ENVIRONMENTS`, the environments whose database `stackra db migrate` migrates only with the
 *          committed compiled SQL: preview, staging and production, the deployed ones a release job migrates. Dev and
 *          test apply the stream gen just wrote, so a new migration runs before it is committed.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended: `stackra db migrate` is the release step); STA-2788.
 */

/** The environments a migration applies only committed SQL to. */
export const COMMITTED_SQL_ENVIRONMENTS: readonly string[] = ["preview", "staging", "production"];

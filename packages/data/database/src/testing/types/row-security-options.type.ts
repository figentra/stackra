/**
 * Stackra file contract:
 * Purpose: `RowSecurityOptions`, what `assertRowSecurity` checks: the owner column whose tables must be under
 *          row-level security, the setting its policy reads, the role the service connects as, the two owner
 *          values the probe reads and writes as, and the tables that hold no owner column by design.
 * Boundary: a type only. The values are the caller's: `@stackra/tenancy/testing` passes its own column and setting.
 * Runtime: node
 * Governing contract: ADR 0239 (decision 1: row-level security); ADR 0231 (policy name `pol_<table>_<column>`); ADR 0347
 *                     (decision 5).
 */

/** The options of `assertRowSecurity`. */
export interface RowSecurityOptions {
  /** The owner column (`owner_id`); every table holding it is checked. */
  readonly column: string;

  /** The setting the policy compares the column with (`app.owner_id`), set for the probe. */
  readonly setting: string;

  /** The role the service connects as; created `NOLOGIN NOBYPASSRLS` with table access when missing. */
  readonly role: string;

  /** Two owner values; the probe reads and writes as the first and must never see or move to the second's rows. */
  readonly probe: readonly [string, string];

  /**
   * The caller's tables that hold no owner column by design, schema-qualified (`catalogue.currencies`), each with its
   * reason; added to `PLATFORM_TABLES`. Every other table without the column is a gap.
   */
  readonly platform?: ReadonlyMap<string, string>;
}

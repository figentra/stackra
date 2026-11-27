/**
 * Stackra file contract:
 * Purpose: `InspectionSession`, the one connection an inspection reads through, inside a READ ONLY transaction:
 *          `execute` runs a statement of the inspection itself with no parameters, and `extended` runs a statement
 *          on the extended protocol with `$n` parameters, which Postgres parses as exactly one statement.
 * Boundary: a type only, internal to `openInspectionSession` and the three inspections.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); STA-2906.
 */
import type { InspectionRow } from "#node/types/inspection-row.type";

/** The connection of one inspection. */
export interface InspectionSession {
  /** Runs one statement of the inspection that takes no parameters. */
  readonly execute: (sql: string) => Promise<readonly InspectionRow[]>;

  /**
   * Runs `sql` on the extended protocol with `params` bound to `$1`, `$2`, …: one statement only, since the extended
   * protocol refuses a second one.
   */
  readonly extended: (sql: string, params: readonly unknown[]) => Promise<readonly InspectionRow[]>;
}

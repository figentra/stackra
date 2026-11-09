/**
 * Stackra file contract:
 * Purpose: `RowSecuritySetting`, one `app.*` transaction setting the row-level-security policies read, as
 *          `readRowSecuritySettings` returns it and `replayRowSecuritySettings` sets it.
 * Boundary: a type only, internal to this package.
 * Runtime: node
 * Governing contract: ADR 0327 (decisions 3 and 5).
 */

/** A transaction setting, by name. */
export interface RowSecuritySetting {
  /** The setting's name (`app.tenant_id`). */
  readonly name: string;

  /** Its value in the transaction it was read from; `''` reads as unset. */
  readonly setting: string;
}

/**
 * Stackra file contract:
 * Purpose: `LockedMigration`, one entry of the `migrations` section of a member's `stackra.manifest.json`: a compiled
 *          migration's id and the SHA-256 of what it compiled to. The section lists them in apply order.
 * Boundary: a type only. `compileMigrations` writes the section after it orders the migrations; `migrationLockOf` reads
 *           it back from the committed manifest; `checkMigrationLock` and `orderMigrations` judge the next run by it.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (2026-10-23 note: gen locks each compiled migration with a SHA-256 in
 *                     `stackra.manifest.json`); STA-2160 (a locked migration is frozen).
 */

/** One locked migration. */
export interface LockedMigration {
  /** `<module>.<NNNN>_<snake stem>` (`billing.0001_create_invoices`). */
  readonly id: string;

  /** The lowercase hex SHA-256 of its compiled `after` ids and steps (`migrationSha256`). */
  readonly sha256: string;
}

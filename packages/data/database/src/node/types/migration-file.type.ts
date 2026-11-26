/**
 * Stackra file contract:
 * Purpose: `MigrationFile`, one compiled migration step as `readMigrationFiles` reads it: its sequence, name, batch,
 *          whether it runs in a transaction, its statement timeout, its SQL, its checksum and its inverse.
 * Boundary: a type only, internal to the migration runner (`migrate`, `rollback`, the memory driver).
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24: the `N_name.up.sql` numbering); ADR 0305 (rules 10 to
 *                     13).
 */
/** One compiled step file. */
export interface MigrationFile {
  /** The sequence number: the `schema_migrations.version` it sets. */
  readonly version: number;

  /** The file name without `.up.sql`. */
  readonly name: string;

  /** The migration it belongs to: the name without the sequence and the trailing step number. */
  readonly batch: string;

  /** Whether the runner wraps it in one transaction. */
  readonly transactional: boolean;

  /** The step's `statement_timeout` from its `-- stackra:timeout=<interval>` header, or `undefined` for the session's. */
  readonly timeout: string | undefined;

  /** The statement text. */
  readonly sql: string;

  /**
   * The SHA-256 hex digest of `sql` without its lint comment lines (`-- squawk-ignore …`, `-- lint: …`), recorded on
   * apply so an edited frozen file is refused while a lint comment can be added to it.
   */
  readonly checksum: string;

  /** The SHA-256 hex digest of the whole `sql`, as recorded before lint lines were left out; still accepted. */
  readonly legacyChecksum: string;

  /** The inverse text, or `undefined` when the step is irreversible. */
  readonly inverse: string | undefined;
}

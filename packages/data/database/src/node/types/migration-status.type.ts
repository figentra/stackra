/**
 * Stackra file contract:
 * Purpose: `MigrationStatus`, what `migrationStatus` answers: the recorded version and dirty flag, each compiled
 *          migration file with whether it is applied and whether it was edited after it was applied, and the applied
 *          versions no file holds any more.
 * Boundary: a type only; plain JSON values, so it is the `--json` document of `stackra db:migrations:status` and the
 *           MCP tool's structured result.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended: the compiled stream and `schema_migrations`); STA-2906.
 */
import type { MigrationFileStatus } from "#node/types/migration-file-status.type";

/** The answer of `migrationStatus`. */
export interface MigrationStatus {
  /** The environment it read (`dev` or `test`). */
  readonly environment: string;
  /** The recorded version (`schema_migrations`), 0 when nothing is applied. */
  readonly version: number;
  /** Whether a run stopped inside the recorded version. */
  readonly dirty: boolean;
  /** Whether `schema_migrations_history` exists (Encore's own runner keeps only `schema_migrations`). */
  readonly ledger: boolean;
  /** Every compiled file, in order. */
  readonly migrations: readonly MigrationFileStatus[];
  /** How many files are not applied yet. */
  readonly pending: number;
  /** The applied versions the history ledger holds that no compiled file has. */
  readonly missing: readonly { readonly version: number; readonly name: string }[];
}

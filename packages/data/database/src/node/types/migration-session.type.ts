/**
 * Stackra file contract:
 * Purpose: `MigrationSession`, what `openMigrationSession` hands its callback: the member's compiled files, a way to
 *          run SQL (optionally in one transaction) and the recorded `schema_migrations` state.
 * Boundary: a type only, internal to the migration runner (`migrate`, `rollback`).
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3 and the 2026-10-24 note); ADR 0305 (rules 10 to 13).
 */
import type { MigrationFile } from "#node/types/migration-file.type";

/** What the callback works with. */
export interface MigrationSession {
  readonly files: readonly MigrationFile[];

  /** Runs `sql`; `wrap` puts it in one transaction. */
  readonly execute: (sql: string, wrap: boolean) => Promise<void>;

  /** Reads the recorded state. */
  readonly state: () => Promise<{ readonly version: number; readonly dirty: boolean }>;
}

/**
 * Stackra file contract:
 * Purpose: `MigrationSession`, what `openMigrationSession` hands its callback: the member's compiled files, a way to
 *          run SQL (optionally in one transaction), read rows, the recorded `schema_migrations` state and the
 *          `schema_migrations_history` ledger.
 * Boundary: a type only, internal to the migration runner (`migrate`, `rollback`).
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3 and the 2026-10-24 note); ADR 0305 (rules 10 to 13).
 */
import type { MigrationFile } from "#node/types/migration-file.type";

/** What `openMigrationSession` hands its callback. */
export interface MigrationSession {
  /** The member's compiled migration files, in order. */
  readonly files: readonly MigrationFile[];

  /** Runs `sql`; `wrap` puts it in one transaction. */
  readonly execute: (sql: string, wrap: boolean) => Promise<void>;

  /** Runs a read and returns its rows (the runner's catalog checks). */
  readonly query: (sql: string) => Promise<readonly Record<string, unknown>[]>;

  /** Reads the recorded state. */
  readonly state: () => Promise<{ readonly version: number; readonly dirty: boolean }>;

  /** Reads the applied steps' ledger, in version order. */
  readonly history: () => Promise<
    readonly { readonly version: number; readonly name: string; readonly checksum: string }[]
  >;
}

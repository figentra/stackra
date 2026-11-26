/**
 * Stackra file contract:
 * Purpose: `GuideDatabase`, what `connectGuideDatabase` hands a task guide's test: the connected memory database, the
 *          compiled SQL of each migration file, and how to drop both.
 * Boundary: test support only, under `scripts/guides`; a type.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159; ADR 0266; STA-2843.
 */
import type { MemoryDatabaseDriver } from "@stackra/database/testing";

/** A connected guide database and how to drop it. */
export interface GuideDatabase {
  /** The memory database, already holding the compiled schema. */
  readonly database: MemoryDatabaseDriver;

  /** The compiled `.up.sql` text of every migration, in order, keyed by file name. */
  readonly sql: Readonly<Record<string, string>>;

  /** Closes the database and removes the temporary member root. */
  readonly close: () => Promise<void>;
}

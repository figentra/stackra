/**
 * Stackra file contract:
 * Purpose: `ClassifiedStatement`, what `classifyMigrationStatement` returns for one compiled migration statement: its
 *          ADR 0159 class, the reason in one line, and the table it creates, when it creates one.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; the 2026-10-23 note).
 */
import type { MigrationSafetyClass } from "#core/types/migration-safety-class.type";

/** One classified statement. */
export interface ClassifiedStatement {
  /** The statement's class. */
  readonly class: MigrationSafetyClass;

  /** Why, in one line. */
  readonly reason: string;

  /** The table it creates, unquoted and lowercased, when it creates one. */
  readonly creates?: string;
}

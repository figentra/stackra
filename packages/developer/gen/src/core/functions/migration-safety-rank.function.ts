/**
 * Stackra file contract:
 * Purpose: `migrationSafetyRank`, the order of the ADR 0159 classes: `additive` 0, `online` 1, `contract` 2, `banned`
 *          3, so a step or migration takes the highest class of its statements.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; the 2026-10-23 note).
 */
import type { MigrationSafetyClass } from "#core/types/migration-safety-class.type";

/** The classes, lowest first. */
const ORDER: readonly MigrationSafetyClass[] = ["additive", "online", "contract", "banned"];

/**
 * The rank of a class.
 *
 * @example
 * migrationSafetyRank("contract"); // 2
 */
export function migrationSafetyRank(safety: MigrationSafetyClass): number {
  return ORDER.indexOf(safety);
}

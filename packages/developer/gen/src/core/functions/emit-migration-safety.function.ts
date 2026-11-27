/**
 * Stackra file contract:
 * Purpose: `emitMigrationSafety`, the `.stackra/migration-safety.json` file of a service: the
 *          `stackra.migration-safety/v1` document `classifyMigrations` returns, as stable two-space JSON, which
 *          `runway evidence` reads to fill the deploy evidence's `destructive`.
 * Boundary: pure: the document in, one generated file out.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3); ADR 0533 (decision 3).
 */
import { MIGRATION_SAFETY_FILE } from "#core/constants/migration-safety-file.constant";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MigrationSafety } from "#core/types/migration-safety.type";

/**
 * The safety file of `safety`.
 *
 * @example
 * emitMigrationSafety(classifyMigrations(ordered).safety).path; // ".stackra/migration-safety.json"
 */
export function emitMigrationSafety(safety: MigrationSafety): GeneratedFile {
  return { path: MIGRATION_SAFETY_FILE, content: `${JSON.stringify(safety, null, 2)}\n` };
}

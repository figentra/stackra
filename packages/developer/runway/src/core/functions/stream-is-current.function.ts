/**
 * Stackra file contract:
 * Purpose: `streamIsCurrent(stream)`, whether a service's migration classes describe what it ships: its safety file
 *          lists exactly the step files in `.stackra/migrations`, each once. A stream with no safety file is never
 *          current: gen writes one for every service (no rows when it has no migration), so a missing one means gen
 *          has not run, as on a fresh checkout where `.stackra/` (gitignored) does not exist yet.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0533 (decision 3); ADR 0159 (decision 3); STA-2866.
 */
import type { MigrationStream } from "#core/types/migration-stream.type";

/**
 * Whether `stream`'s classes cover exactly its compiled files.
 *
 * @example
 * streamIsCurrent({ member: "billing", safety: undefined, compiled: [] }); // false: gen has not run
 */
export function streamIsCurrent(stream: MigrationStream): boolean {
  if (stream.safety === undefined) return false;
  const classified = stream.safety.migrations.flatMap((row) => row.files);
  const compiled = new Set(stream.compiled);
  return (
    classified.length === compiled.size &&
    new Set(classified).size === classified.length &&
    classified.every((file) => compiled.has(file))
  );
}

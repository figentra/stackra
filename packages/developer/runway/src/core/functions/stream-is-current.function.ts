/**
 * Stackra file contract:
 * Purpose: `streamIsCurrent(stream)`, whether a service's migration classes describe what it ships: its safety file
 *          lists exactly the step files in `.stackra/migrations`, each once; a stream with no safety file is current
 *          only when it compiled nothing.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0533 (decision 3); ADR 0159 (decision 3); STA-2866.
 */
import type { MigrationStream } from "#core/types/migration-stream.type";

/**
 * Whether `stream`'s classes cover exactly its compiled files.
 *
 * @example
 * streamIsCurrent({ member: "billing", safety: undefined, compiled: [] }); // true: no migrations
 */
export function streamIsCurrent(stream: MigrationStream): boolean {
  if (stream.safety === undefined) return stream.compiled.length === 0;
  const classified = stream.safety.migrations.flatMap((row) => row.files);
  const compiled = new Set(stream.compiled);
  return (
    classified.length === compiled.size &&
    new Set(classified).size === classified.length &&
    classified.every((file) => compiled.has(file))
  );
}

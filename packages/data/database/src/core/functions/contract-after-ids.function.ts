/**
 * Stackra file contract:
 * Purpose: `contractAfterIds(sql)`, the ids of the migrations the contract steps of one compiled file wait for, read from
 *          the `CONTRACT_AFTER_MARKER` lines their release gates carry, in file order without repeats.
 * Boundary: pure text read of a compiled file; a line counts only when it is the marker followed by a migration id
 *           (`MIGRATION_ID_PATTERN`), alone on its line. A file with no contract step answers `[]`.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3: a destructive step ships in a later release than the change that made it
 *                     safe).
 */
import { CONTRACT_AFTER_MARKER } from "#core/constants/contract-after-marker.constant";
import { MIGRATION_ID_PATTERN } from "#core/constants/migration-id-pattern.constant";

/**
 * The migration ids `sql`'s contract steps wait for.
 *
 * @example
 * contractAfterIds("do $$\n-- stackra:contract-after=orders.0007_stop_writing_note\n..."); // ["orders.0007_stop_writing_note"]
 */
export function contractAfterIds(sql: string): readonly string[] {
  const ids = new Set<string>();
  for (const line of sql.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith(CONTRACT_AFTER_MARKER)) continue;
    const id = trimmed.slice(CONTRACT_AFTER_MARKER.length);
    if (MIGRATION_ID_PATTERN.test(id)) ids.add(id);
  }
  return [...ids];
}

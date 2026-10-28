/**
 * Stackra file contract:
 * Purpose: `migrationId`, the identity of a migration file: `<module>.<NNNN>_<snake stem>` from
 *          `NNNN-<kebab stem>.migration.ts` (`search.0001_create_text_functions`), the id `Migration({ after })` names
 *          and the compiled file names carry.
 * Boundary: pure. Returns undefined for a name that is not `NNNN-<kebab>.migration.ts`; `check-conventions` refuses
 *           those (`migration_numbering`).
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24); ADR 0294 (decision 20).
 */

/** A migration file name. */
const MIGRATION_FILE = /^(\d{4})-([a-z0-9]+(?:-[a-z0-9]+)*)\.migration\.ts$/;

/**
 * The id of a migration file in `module`.
 *
 * @example
 * migrationId("search", "0001-create-text-functions.migration.ts"); // "search.0001_create_text_functions"
 */
export function migrationId(module: string, file: string): string | undefined {
  const match = MIGRATION_FILE.exec(file);
  if (match === null) return undefined;
  return `${module}.${match[1]}_${(match[2] ?? "").replaceAll("-", "_")}`;
}

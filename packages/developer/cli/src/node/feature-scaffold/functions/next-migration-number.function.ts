/**
 * Stackra file contract:
 * Purpose: `nextMigrationNumber(folder)`, the four-digit number of a module's next migration: one above the highest
 *          `NNNN-` file in its `database/migrations/`, `0001` when it has none.
 * Boundary: reads the folder listing only.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: migrations run in file order).
 */
import { existsSync, readdirSync } from "node:fs";

/**
 * The next migration number.
 *
 * @param folder - the module's `database/migrations` folder.
 * @example
 * nextMigrationNumber("src/modules/orders/database/migrations"); // "0003"
 */
export function nextMigrationNumber(folder: string): string {
  const highest = existsSync(folder)
    ? Math.max(
        0,
        ...readdirSync(folder)
          .map((file) => /^(\d+)-.*\.migration\.ts$/.exec(file)?.[1])
          .filter((number): number is string => number !== undefined)
          .map(Number),
      )
    : 0;
  return String(highest + 1).padStart(4, "0");
}

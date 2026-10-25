/**
 * Stackra file contract:
 * Purpose: `entryOf`, the package entry a source file is exported from, by its path: `src/config` and `src/core` are
 *          `index` (the `.` entry), `src/node/database/{factories,seeders}` are `testing`, and `contracts`, `node`,
 *          `react`, `native` and `testing` are their own entries.
 * Boundary: pure. One answer feeds the entry barrels and every import a host writes from a dependency, so the two
 *           never disagree. A file outside the entry folders has no entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15: entry folders); ADR 0127 2026-10-24 note (the allowed entries).
 */

/** The package entries, in the order their barrels are written. */
type Entry = "index" | "contracts" | "node" | "react" | "native" | "testing";

/**
 * The entry of the file at `file`, relative to the member root.
 *
 * @example
 * entryOf("src/core/services/loyalty.service.ts"); // "index"
 * entryOf("src/node/database/seeders/demo.seeder.ts"); // "testing"
 */
export function entryOf(file: string): Entry | undefined {
  const parts = file.split("/");
  const folder = parts.length > 2 ? parts[1] : "";
  if (/^src\/node\/database\/(factories|seeders)\//.test(file)) return "testing";
  if (folder === "" || folder === "config" || folder === "core") return "index";
  if (
    folder === "contracts" ||
    folder === "node" ||
    folder === "react" ||
    folder === "native" ||
    folder === "testing"
  )
    return folder;
  return undefined;
}

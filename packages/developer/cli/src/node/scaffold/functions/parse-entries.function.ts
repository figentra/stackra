/**
 * Stackra file contract:
 * Purpose: `parseEntries(value)`, the optional package entries a `--entries` value names, in exports order; the
 *          others always come (moved from `tools/scripts/scaffold.mjs`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0126 (member shapes and scaffold templates); ADR 0294; ADR 0453 (decision 11).
 */
import { ENTRY_NAMES, OPTIONAL_ENTRY_NAMES } from "@stackra/repo-checks/node";

/**
 * The picked optional entries.
 *
 * @param value - `"none"`, `""`, an array or a comma list.
 * @throws Error when a name is not an entry.
 * @example
 * parseEntries("native,contracts,react"); // ["react", "native"]
 */
export function parseEntries(value: string | readonly string[] = []): string[] {
  const list = (Array.isArray(value) ? value : String(value).split(","))
    .map((e: string) => e.trim())
    .filter((e: string) => e && e !== "none");
  for (const e of list)
    if (!ENTRY_NAMES.includes(e))
      throw new Error(
        `unknown entry "${e}" — optional: ${OPTIONAL_ENTRY_NAMES.join(", ")} (core, contracts, node and testing always come)`,
      );
  return OPTIONAL_ENTRY_NAMES.filter((e) => list.includes(e));
}

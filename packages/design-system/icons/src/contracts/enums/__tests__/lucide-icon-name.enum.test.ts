/**
 * Stackra file contract:
 * Purpose: proves the committed `LucideIconName` list is exactly the icons the installed `lucide-react` and
 *          `lucide-react-native` packages ship, sorted and without duplicates, so a Lucide bump that adds or removes an
 *          icon fails here until `pnpm --filter @stackra/icons generate` is run.
 * Boundary: reads the installed packages' icon files from disk; imports no icon component.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10); ADR 0022 (test placement).
 */
// @covers sta-350:FR-047 sta-350:FR-048
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { LucideIconName } from "#contracts/enums/lucide-icon-name.enum";

const require = createRequire(import.meta.url);

/** The kebab-case icon files of an installed Lucide package: one per canonical icon. */
const shipped = (packageName: string): string[] =>
  readdirSync(join(dirname(dirname(require.resolve(packageName))), "esm", "icons"))
    .filter((file) => file.endsWith(".mjs") && file !== "index.mjs")
    .map((file) => file.slice(0, -".mjs".length))
    .sort();

describe("LucideIconName", () => {
  it("is every canonical icon the installed lucide-react-native ships", () => {
    expect([...LucideIconName]).toEqual(shipped("lucide-react-native"));
  });

  it("names only icons the installed lucide-react ships as well", () => {
    const web = new Set(shipped("lucide-react"));
    expect(LucideIconName.filter((name) => !web.has(name))).toEqual([]);
  });

  it("is sorted, unique and kebab-case", () => {
    expect([...LucideIconName]).toEqual([...new Set(LucideIconName)].sort());
    for (const name of LucideIconName) expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

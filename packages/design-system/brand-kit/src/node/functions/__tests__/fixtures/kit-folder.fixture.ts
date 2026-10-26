/**
 * Stackra file contract:
 * Purpose: `makeKitFolder(id, files)`, a kit folder in a fresh temporary folder for the node tests: a valid
 *          `kit.json`, a README, a changes-only theme over the stackra theme and a square symbol under `marks/`, with
 *          `files` added or replaced.
 * Boundary: test data only; writes under the system temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 4).
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/**
 * A temporary repository with a kit at `assets/brand`; answers the repository root and the kit folder.
 *
 * @example
 * const { root, kit } = makeKitFolder("acme", { "marks/extra.svg": "<svg/>" });
 */
export function makeKitFolder(
  id: string,
  files: Readonly<Record<string, string>> = {},
): { readonly root: string; readonly kit: string } {
  const root = mkdtempSync(join(tmpdir(), "brand-kit-"));
  const kit = join(root, "assets", "brand");
  const all: Record<string, string> = {
    "kit.json": JSON.stringify({
      id,
      name: { en: id },
      theme: "theme.json",
      symbol: "marks/symbol.svg",
    }),
    "README.md": `# ${id}\n`,
    "theme.json": JSON.stringify({ format: "stackra.theme-diff/2", changes: {} }),
    "marks/symbol.svg":
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M2 2h20v20H2z"/></svg>',
    ...files,
  };
  for (const [path, text] of Object.entries(all)) {
    mkdirSync(dirname(join(kit, path)), { recursive: true });
    writeFileSync(join(kit, path), text);
  }
  return { root, kit };
}

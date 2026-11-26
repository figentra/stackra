/**
 * Stackra file contract:
 * Purpose: `testFiles(root)`, the repository-relative path (forward slashes, sorted) of every test file of the
 *          checkout: a `<name>.test.<ext>` file (`.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.jsx`, `.mjs`, `.cjs`) directly
 *          in a `__tests__/` folder, every tier included (`.int`, `.e2e`, …, ADR 0182 decision 1; ADR 0022).
 * Boundary: walks the checkout and reads names only; writes nothing. Skips dependencies (`node_modules`), `.git`,
 *           agent worktrees (`.claude`), the private notes (`.notes`), build output (`dist`, `.turbo`, `.stackra`,
 *           `coverage`), virtual environments and `__fixtures__` (a fixture is data, not a test of this checkout).
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (decision 4); STA-2842.
 */
import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { sorted } from "#node/functions/sorted.function";

/** Folders never searched. */
const SKIPPED = new Set([
  "node_modules",
  ".git",
  ".claude",
  ".notes",
  "dist",
  ".turbo",
  ".stackra",
  "coverage",
  ".venv",
  "venv",
  "__fixtures__",
]);

/** A test file's name. */
const TEST_FILE = /\.test\.(?:[cm]?[jt]s|[jt]sx)$/;

/**
 * Every test file under `root`.
 *
 * @param root - the checkout root.
 * @example
 * testFiles(root); // ["packages/data/model/src/core/__tests__/model.test.ts", …]
 */
export function testFiles(root: string): string[] {
  const found: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIPPED.has(entry.name)) visit(join(directory, entry.name));
      } else if (
        entry.isFile() &&
        TEST_FILE.test(entry.name) &&
        directory.endsWith(`${sep}__tests__`)
      ) {
        found.push(relative(root, join(directory, entry.name)).split(sep).join("/"));
      }
    }
  };
  visit(root);
  return sorted(found);
}

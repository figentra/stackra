/**
 * Stackra file contract:
 * Purpose: `fixtureWorkspace(files)`, a throwaway pnpm workspace in the OS temp folder for the `stackra upgrade`
 *          tests: writes each file (creating its folders) and answers the root and a cleanup.
 * Boundary: test helper only; writes under the OS temp folder and removes it on `remove()`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-145.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/** A workspace on disk. */
export function fixtureWorkspace(files: Readonly<Record<string, string>>): {
  readonly root: string;
  readonly remove: () => void;
} {
  const root = mkdtempSync(join(tmpdir(), "stackra-upgrade-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return { root, remove: () => rmSync(root, { recursive: true, force: true }) };
}

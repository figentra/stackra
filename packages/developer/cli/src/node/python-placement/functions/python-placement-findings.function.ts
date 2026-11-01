/**
 * Stackra file contract:
 * Purpose: `pythonPlacementFindings(root)`, the Python placement check of `stackra validate --repository` (ADR 0492
 *          decision 7, STA-1637): one finding per `.py` file outside `PYTHON_HOME`, because Python runs only as
 *          tools-stack images behind ports: no Python service, no Python in a member, no Python business logic (moved
 *          from `tools/scripts/python-placement.mjs`).
 * Boundary: walks the checkout and reads names only; writes nothing. Skips `node_modules`, `.git`, `.claude` (agent
 *           worktrees), `.notes` (the private submodule), build output (`dist`, `.turbo`, `.stackra`) and virtual
 *           environments (`.venv`, `venv`).
 * Runtime: node
 * Governing contract: ADR 0492 (decision 7 and its enforcement list); STA-1637.
 */
import { readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

import { sorted } from "#node/functions/sorted.function";
import { PYTHON_HOME } from "#node/python-placement/constants/python-home.constant";
import type { DirFinding } from "#node/types/dir-finding.type";

/** Folders never searched. */
const SKIPPED = new Set([
  "node_modules",
  ".git",
  ".claude",
  ".notes",
  "dist",
  ".turbo",
  ".stackra",
  ".venv",
  "venv",
]);

/** The repo-relative paths (forward slashes) of every `.py` file under `root`. */
function pythonFiles(root: string): string[] {
  const found: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIPPED.has(entry.name)) visit(join(directory, entry.name));
      } else if (entry.name.endsWith(".py")) {
        found.push(relative(root, join(directory, entry.name)).split(sep).join("/"));
      }
    }
  };
  visit(root);
  return sorted(found);
}

/**
 * One finding per `.py` file outside the images folder.
 *
 * @param root - the checkout root.
 * @example
 * pythonPlacementFindings(root); // [{ dir: "services/example/src", text: "tool.py: ..." }]
 */
export function pythonPlacementFindings(root: string): DirFinding[] {
  return pythonFiles(root)
    .filter((file) => !file.startsWith(PYTHON_HOME))
    .map((file) => ({
      dir: dirname(file),
      text: `${file.slice(file.lastIndexOf("/") + 1)}: Python runs only as a tools-stack image under ${PYTHON_HOME} (ADR 0492 decision 7)`,
    }));
}

#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the Python placement check of `pnpm validate` (ADR 0492 decision 7, STA-1637): fails when a `.py` file sits
 *          anywhere outside `packages/infrastructure/infra-tools/images/`, because Python runs only as tools-stack
 *          images behind ports: no Python service, no Python in a member, no Python business logic.
 * Boundary: walks the checkout and reads names only; writes nothing. Skips `node_modules`, `.git`, `.claude` (agent
 *           worktrees), `.notes` (the private submodule), build output (`dist`, `.turbo`, `.stackra`) and virtual
 *           environments (`.venv`, `venv`). Run directly it prints the findings and exits 1.
 * Runtime: node
 * Governing contract: ADR 0492 (decision 7 and its enforcement list).
 * Scope: every file in the checkout.
 * Owner: release-operations · Secrets: forbidden
 */
import { readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// oxlint-disable stackra/one-declaration-per-file -- reason: a plain-node script module run by pnpm validate, not member source (like package-cycles.mjs); its tests import these names

/** The one folder Python may live in. */
export const PYTHON_HOME = "packages/infrastructure/infra-tools/images/";

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
function pythonFiles(root) {
  const found = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIPPED.has(entry.name)) visit(join(directory, entry.name));
      } else if (entry.name.endsWith(".py")) {
        found.push(relative(root, join(directory, entry.name)).split(sep).join("/"));
      }
    }
  };
  visit(root);
  return found.toSorted();
}

/**
 * One finding per `.py` file outside the images folder.
 *
 * @example
 * pythonPlacementFindings(root); // [{ dir: "services/example/src", text: "tool.py: ..." }]
 */
export function pythonPlacementFindings(root) {
  return pythonFiles(root)
    .filter((file) => !file.startsWith(PYTHON_HOME))
    .map((file) => ({
      dir: dirname(file),
      text: `${file.slice(file.lastIndexOf("/") + 1)}: Python runs only as a tools-stack image under ${PYTHON_HOME} (ADR 0492 decision 7)`,
    }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const findings = pythonPlacementFindings(fileURLToPath(new URL("../../", import.meta.url)));
  for (const { dir, text } of findings) console.error(`${dir}: ${text}`);
  if (findings.length) process.exit(1);
}

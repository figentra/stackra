/**
 * Stackra file contract:
 * Purpose: `repositoryRoot()`, the repository root the working directory is in: the nearest directory, walking up,
 *          that holds `pnpm-workspace.yaml`. The root runway is `<root>/runway.yaml`.
 * Boundary: internal; reads the file system only.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 2: one root runway per repository).
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";

/**
 * The repository root.
 *
 * @throws RunwayUnresolvedError when no ancestor of the working directory holds `pnpm-workspace.yaml`.
 * @example
 * repositoryRoot(); // "/work/acme-platform" from /work/acme-platform/apps/console
 */
export function repositoryRoot(): string {
  for (let directory = process.cwd(); ; directory = dirname(directory)) {
    if (existsSync(join(directory, "pnpm-workspace.yaml"))) return directory;
    if (dirname(directory) === directory) {
      throw new RunwayUnresolvedError(
        `No repository root above ${process.cwd()}: no directory holds pnpm-workspace.yaml`,
      );
    }
  }
}

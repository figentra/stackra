/**
 * Stackra file contract:
 * Purpose: `packageCycleFindings(root)`, the package-cycle findings of the workspace at `root`, one per cycle with its
 *          full path: turbo refuses every task on a cyclic graph and pnpm only warns, so this names the cycle before
 *          either runs (moved from `tools/scripts/package-cycles.mjs`, STA-1373).
 * Boundary: reads pnpm-workspace.yaml and each member's package.json; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0003 (tier dependency direction); ADR 0117; STA-1373.
 */
import { findPackageCycles } from "#node/cycles/functions/find-package-cycles.function";
import { packageGraph } from "#node/cycles/functions/package-graph.function";
import { readManifestMembers } from "#node/functions/read-workspace-members.function";
import type { DirFinding } from "#node/types/dir-finding.type";

/**
 * One finding per package cycle under `root`.
 *
 * @param root - the workspace root.
 * @example
 * packageCycleFindings(root); // [{ dir: "pnpm-workspace.yaml", text: "package cycle: @stackra/a → @stackra/b → @stackra/a (…)" }]
 */
export function packageCycleFindings(root: string): DirFinding[] {
  return findPackageCycles(packageGraph(readManifestMembers(root))).map((cycle) => ({
    dir: "pnpm-workspace.yaml",
    text: `package cycle: ${cycle.join(" → ")} (break it: turbo refuses every task while it exists)`,
  }));
}

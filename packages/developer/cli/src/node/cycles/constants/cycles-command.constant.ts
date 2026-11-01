/**
 * Stackra file contract:
 * Purpose: `CYCLES_COMMAND`, `stackra cycles`: the package-cycle check of `pnpm validate` on its own. Prints each cycle
 *          as `<dir>: <finding>` and exits 1, or prints nothing and exits 0 (was `tools/scripts/package-cycles.mjs`).
 * Boundary: reads the workspace manifests; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0003; ADR 0117; STA-1373; ADR 0282 (decision 3).
 */
import { packageCycleFindings } from "#node/cycles/functions/package-cycle-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra cycles` command. */
export const CYCLES_COMMAND: CliCommand = {
  name: "cycles",
  summary:
    "Fail on any workspace package cycle (dependencies, dev, peer, optional), printing its path",
  usage: "stackra cycles",
  async run({ cwd, io }) {
    const findings = packageCycleFindings(workspaceRoot(cwd));
    for (const { dir, text } of findings) io.err(`${dir}: ${text}\n`);
    return findings.length > 0 ? 1 : 0;
  },
};

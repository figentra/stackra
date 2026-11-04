/**
 * Stackra file contract:
 * Purpose: `CyclesCommand`, `stackra cycles`: the package-cycle check of `pnpm validate` on its own. Each cycle is a
 *          failed checklist row naming its path (the findings are the `--json` data) and any cycle exits 1 (was
 *          `tools/scripts/package-cycles.mjs`).
 * Boundary: reads the workspace manifests; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0003; ADR 0117; STA-1373; ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { Command, type CommandIo } from "@stackra/console";

import { packageCycleFindings } from "#node/cycles/functions/package-cycle-findings.function";
import { reportFindings } from "#node/functions/report-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Fails on any workspace package cycle. */
export class CyclesCommand extends Command({
  name: "cycles",
  description:
    "Fail on any workspace package cycle (dependencies, dev, peer, optional), printing its path",
  bin: true,
}) {
  /** Reports every package cycle. */
  async handle(io: CommandIo): Promise<number> {
    return reportFindings(io, packageCycleFindings(workspaceRoot(io.cwd)), "no package cycle");
  }
}

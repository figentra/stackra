/**
 * Stackra file contract:
 * Purpose: `AgentsCheckCommand`, `stackra agents check` (`agents:check`): fails when the project's generated agent
 *          files drifted, that is when `.mcp.json` is not exactly what `.mcp.yaml` renders to. The drift is a failed
 *          checklist row (the one finding is the `--json` data) and exits 1.
 * Boundary: reads only; `stackra agents sync` repairs drift.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 10 and enforcement: `stackra agents check` fails on drift between `.mcp.yaml`
 *                     and `.mcp.json`); ADR 0506; STA-1966.
 */
import { Command, type CommandIo } from "@stackra/console";
import { checkMcpConfig } from "@stackra/mcp/node";

import { reportFindings } from "#node/functions/report-findings.function";

/** Fails when `.mcp.json` drifted from `.mcp.yaml`. */
export class AgentsCheckCommand extends Command({
  name: "agents:check",
  description: "Fail when .mcp.json drifted from .mcp.yaml",
  bin: true,
}) {
  /** Compares `.mcp.json` with what `.mcp.yaml` renders to, in the working directory. */
  async handle(io: CommandIo): Promise<number> {
    const findings = checkMcpConfig(io.cwd)
      ? []
      : [{ dir: ".mcp.json", text: "drifted from .mcp.yaml; run `stackra agents sync`" }];
    return reportFindings(io, findings, ".mcp.json matches .mcp.yaml");
  }
}

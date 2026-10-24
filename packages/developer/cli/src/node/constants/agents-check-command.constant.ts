/**
 * Stackra file contract:
 * Purpose: `AGENTS_CHECK_COMMAND`, `stackra agents check`: fails when the project's generated agent files drifted,
 *          that is when `.mcp.json` is not exactly what `.mcp.yaml` renders to.
 * Boundary: reads only; `stackra agents sync` repairs drift.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 10 and enforcement: `stackra agents check` fails on drift between `.mcp.yaml`
 *                     and `.mcp.json`).
 */
import { checkMcpConfig } from "@stackra/mcp/node";

import type { CliCommand } from "#node/types/cli-command.type";

/** `stackra agents check`. */
export const AGENTS_CHECK_COMMAND: CliCommand = {
  name: "agents check",
  summary: "Fail when .mcp.json drifted from .mcp.yaml",
  usage: "stackra agents check",
  async run({ cwd, io }) {
    if (checkMcpConfig(cwd)) {
      io.out(".mcp.json matches .mcp.yaml\n");
      return 0;
    }
    io.err(".mcp.json drifted from .mcp.yaml; run `stackra agents sync`\n");
    return 1;
  },
};

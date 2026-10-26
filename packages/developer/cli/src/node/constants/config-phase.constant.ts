/**
 * Stackra file contract:
 * Purpose: `CONFIG_PHASE`, phase 1 of `stackra check`: config files are JSON, JSONC or YAML where their reader needs, repo
 *          YAML parses and uses block style, and `.gitignore` ignores `.stackra/*` (`configFindings`).
 * Boundary: reads files only; needs no install.
 * Runtime: node
 * Governing contract: the YAML standard (STA-299); ADR 0295 (decision 5).
 */
import { configFindings, readRepoContext, toFinding } from "@stackra/repo-checks/node";

import type { CheckPhase } from "#node/types/check-phase.type";

/** The `config` phase. */
export const CONFIG_PHASE: CheckPhase = {
  name: "config",
  tool: "repo-checks",
  adr: null,
  async run({ root }) {
    return {
      findings: configFindings(readRepoContext(root)).map((raw) => toFinding("config", raw)),
    };
  },
};

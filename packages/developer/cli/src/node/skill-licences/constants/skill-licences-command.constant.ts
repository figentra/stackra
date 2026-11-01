/**
 * Stackra file contract:
 * Purpose: `SKILL_LICENCES_COMMAND`, `stackra skill-licences`: the agent skill and plugin licence check (STA-272).
 *          Prints each finding and exits 1, or prints the all-clear line (was `tools/scripts/skill-licences.mjs`).
 * Boundary: reads the checkout; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0174 (licence allow-list); ADR 0258 (agent skills); STA-272. ADR 0282 (decision 3).
 */
import { workspaceRoot } from "#node/functions/workspace-root.function";
import { checkLicences } from "#node/skill-licences/functions/check-licences.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra skill-licences` command. */
export const SKILL_LICENCES_COMMAND: CliCommand = {
  name: "skill-licences",
  summary: "Fail when an agent skill or enabled plugin lacks an allowed licence",
  usage: "stackra skill-licences",
  async run({ cwd, io }) {
    const findings = checkLicences(workspaceRoot(cwd));
    for (const f of findings) io.err(`skill-licences: ${f}\n`);
    if (findings.length > 0) return 1;
    io.out("skill-licences: every skill and enabled plugin carries an allowed licence\n");
    return 0;
  },
};

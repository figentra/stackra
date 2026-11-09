/**
 * Stackra file contract:
 * Purpose: `SkillLicencesCommand`, `stackra skill-licences`: the agent skill and plugin licence check (STA-272). Each
 *          finding is a failed checklist row (the findings, as `{ dir: "", text }`, are the `--json` data) and any
 *          finding exits 1, or it prints the all-clear line (was `tools/scripts/skill-licences.mjs`).
 * Boundary: reads the checkout; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0174 (licence allow-list); ADR 0258 (agent skills); STA-272; ADR 0282 (decision 3);
 *                     ADR 0506; STA-1966.
 */
import { Command, type CommandIo } from "@stackra/console";

import { reportFindings } from "#node/functions/report-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import { checkLicences } from "#node/skill-licences/functions/check-licences.function";

/** Fails when an agent skill or enabled plugin lacks an allowed licence. */
export class SkillLicencesCommand extends Command({
  name: "skill-licences",
  description: "Fail when an agent skill or enabled plugin lacks an allowed licence",
  bin: true,
}) {
  /** Reports the licence findings. */
  async handle(io: CommandIo): Promise<number> {
    // Each finding names its own skill or file, so it carries no folder.
    const findings = checkLicences(workspaceRoot(io.cwd)).map((text) => ({ dir: "", text }));
    return reportFindings(
      io,
      findings,
      "every skill and enabled plugin carries an allowed licence",
    );
  }
}

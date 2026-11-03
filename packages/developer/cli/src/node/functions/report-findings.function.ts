/**
 * Stackra file contract:
 * Purpose: `reportFindings(io, findings, clean)`, how every repository check command (`cycles`, `any-ratchet`,
 *          `doc-standard`, `agents check`, …) reports: each finding a failed checklist row named by its folder (or by
 *          its text when it has none), the clean line when there is none, and the findings array itself as the `--json`
 *          data. Returns the exit code: 1 on any finding, else 0.
 * Boundary: output only; the checks find, this draws.
 * Runtime: node
 * Governing contract: ADR 0506; ADR 0500 (decision 7); ADR 0282 (decision 3); STA-1966.
 */
import type { CommandIo } from "@stackra/console";

import type { DirFinding } from "#node/types/dir-finding.type";

/**
 * Reports a check's findings and returns its exit code.
 *
 * @param io - the command's io.
 * @param findings - what the check found; `dir` may be "" when the text names its own path.
 * @param clean - the success line when nothing was found.
 * @example
 * return reportFindings(io, packageCycleFindings(root), "no package cycle");
 */
export function reportFindings(
  io: CommandIo,
  findings: readonly DirFinding[],
  clean: string,
): number {
  if (io.json) io.output.json(findings);
  else if (findings.length > 0)
    io.output.checklist({
      rows: findings.map(({ dir, text }) =>
        dir === ""
          ? { name: text, status: "fail" as const }
          : { name: dir, status: "fail" as const, detail: text },
      ),
    });
  else io.output.success(clean);
  return findings.length > 0 ? 1 : 0;
}

/**
 * Stackra file contract:
 * Purpose: `DocStandardCommand`, `stackra doc-standard`: the doc-standard check of `pnpm validate` (ADR 0007, amended
 *          2026-10-21) over every scoped source file. Each finding is a failed checklist row (the findings are the
 *          `--json` data) and any finding exits 1, or it prints the clean line (was `tools/scripts/doc-standard.mjs`).
 *          `stackra check --only docs` runs the same check as a phase.
 * Boundary: reads tracked files and reports findings; it never edits a file and never judges the wording of a block.
 * Runtime: node
 * Governing contract: ADR 0007 (amendment 2026-10-21); ADR 0128; ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { Command, type CommandIo } from "@stackra/console";
import { docsFindings, isDocScoped, readRepoContext } from "@stackra/repo-checks/node";

import { reportFindings } from "#node/functions/report-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Checks every source file's contract header and TSDoc. */
export class DocStandardCommand extends Command({
  name: "doc-standard",
  description: "Check every source file's contract header and TSDoc (ADR 0007)",
  bin: true,
}) {
  /** Reports the doc-standard findings. */
  async handle(io: CommandIo): Promise<number> {
    const context = readRepoContext(workspaceRoot(io.cwd));
    const scoped = context.files.filter(isDocScoped).length;
    return reportFindings(io, docsFindings(context), `${scoped} source file(s) clean`);
  }
}

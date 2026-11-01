/**
 * Stackra file contract:
 * Purpose: `DOC_STANDARD_COMMAND`, `stackra doc-standard`: the doc-standard check of `pnpm validate` (ADR 0007, amended
 *          2026-10-21) over every scoped source file. Prints each finding, a count and exits 1, or prints the clean
 *          line (was `tools/scripts/doc-standard.mjs`). `stackra check --only docs` runs the same check as a phase.
 * Boundary: reads tracked files and reports findings; it never edits a file and never judges the wording of a block.
 * Runtime: node
 * Governing contract: ADR 0007 (amendment 2026-10-21); ADR 0128; ADR 0282 (decision 3).
 */
import { docsFindings, isDocScoped, readRepoContext } from "@stackra/repo-checks/node";

import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra doc-standard` command. */
export const DOC_STANDARD_COMMAND: CliCommand = {
  name: "doc-standard",
  summary: "Check every source file's contract header and TSDoc (ADR 0007)",
  usage: "stackra doc-standard",
  async run({ cwd, io }) {
    const context = readRepoContext(workspaceRoot(cwd));
    const scoped = context.files.filter(isDocScoped).length;
    const findings = docsFindings(context);
    for (const { text } of findings) io.err(`${text}\n`);
    if (findings.length > 0) {
      io.err(`\n${findings.length} doc-standard finding(s) in ${scoped} file(s).\n`);
      return 1;
    }
    io.out(`doc-standard: ${scoped} source file(s) clean.\n`);
    return 0;
  },
};

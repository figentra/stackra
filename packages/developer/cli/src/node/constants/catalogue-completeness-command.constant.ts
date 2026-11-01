/**
 * Stackra file contract:
 * Purpose: `CATALOGUE_COMPLETENESS_COMMAND`, `stackra catalogue-completeness`: the lang catalogue gate on its own
 *          (`checkCatalogues`): every locale has English's keys and, per message, the same ICU placeholders. Prints
 *          the findings and a count and exits 1, or prints nothing (was `tools/scripts/catalogue-completeness.mjs`).
 *          `stackra check --only catalogues` and `stackra validate --repository` run the same check.
 * Boundary: reads the git-listed `assets/lang` JSON files outside the scaffold templates; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0403 (catalogues and a completeness gate); ADR 0282 (decision 3).
 */
import { catalogueFindings, readRepoContext } from "@stackra/repo-checks/node";

import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra catalogue-completeness` command. */
export const CATALOGUE_COMPLETENESS_COMMAND: CliCommand = {
  name: "catalogue-completeness",
  summary: "Check every lang catalogue has English's keys and placeholders (ADR 0403)",
  usage: "stackra catalogue-completeness",
  async run({ cwd, io }) {
    const findings = catalogueFindings(readRepoContext(workspaceRoot(cwd)));
    for (const { text } of findings) io.err(`${text}\n`);
    if (findings.length > 0) {
      io.err(`\n${findings.length} catalogue finding(s).\n`);
      return 1;
    }
    return 0;
  },
};

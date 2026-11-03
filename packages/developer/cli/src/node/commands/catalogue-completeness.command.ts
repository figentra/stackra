/**
 * Stackra file contract:
 * Purpose: `CatalogueCompletenessCommand`, `stackra catalogue-completeness`: the lang catalogue gate on its own
 *          (`catalogueFindings`): every locale has English's keys and, per message, the same ICU placeholders. Each
 *          finding is a failed checklist row (the findings are the `--json` data) and any finding exits 1 (was
 *          `tools/scripts/catalogue-completeness.mjs`). `stackra check --only catalogues` and
 *          `stackra validate --repository` run the same check.
 * Boundary: reads the git-listed `assets/lang` JSON files outside the scaffold templates; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0403 (catalogues and a completeness gate); ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { Command, type CommandIo } from "@stackra/console";
import { catalogueFindings, readRepoContext } from "@stackra/repo-checks/node";

import { reportFindings } from "#node/functions/report-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Checks every lang catalogue against English. */
export class CatalogueCompletenessCommand extends Command({
  name: "catalogue-completeness",
  description: "Check every lang catalogue has English's keys and placeholders (ADR 0403)",
  bin: true,
}) {
  /** Reports the catalogue findings. */
  async handle(io: CommandIo): Promise<number> {
    return reportFindings(
      io,
      catalogueFindings(readRepoContext(workspaceRoot(io.cwd))),
      "every lang catalogue is complete",
    );
  }
}

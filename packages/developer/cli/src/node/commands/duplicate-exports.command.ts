/**
 * Stackra file contract:
 * Purpose: `DuplicateExportsCommand`, `stackra duplicate-exports`: the duplicate-export check of `pnpm validate` on
 *          its own. Each finding is a failed checklist row (the findings are the `--json` data), a warning names the
 *          `ALLOWED` entries that no longer match a duplicate, and any finding exits 1 (was
 *          `tools/scripts/duplicate-exports.mjs`).
 * Boundary: reads the workspace sources; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0305; stackra-224 (STA-1382); ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { Command, type CommandIo } from "@stackra/console";

import { ALLOWED } from "#node/duplicate-exports/constants/allowed.constant";
import { duplicateExportFindings } from "#node/duplicate-exports/functions/duplicate-export-findings.function";
import { staleAllowListEntries } from "#node/duplicate-exports/functions/stale-allow-list-entries.function";
import { reportFindings } from "#node/functions/report-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Fails when one exported name is declared in two packages. */
export class DuplicateExportsCommand extends Command({
  name: "duplicate-exports",
  description: "Fail when one exported name is declared in two packages' src/",
  bin: true,
}) {
  /** Reports the duplicated names, then the stale allow-list entries. */
  async handle(io: CommandIo): Promise<number> {
    const root = workspaceRoot(io.cwd);
    const code = reportFindings(
      io,
      duplicateExportFindings(root),
      "no exported name is declared twice",
    );
    const stale = staleAllowListEntries(root, ALLOWED, {});
    if (stale.length > 0)
      io.output.warn(`no longer duplicated, remove from ALLOWED: ${stale.join(", ")}`);
    return code;
  }
}

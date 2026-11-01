/**
 * Stackra file contract:
 * Purpose: `DUPLICATE_EXPORTS_COMMAND`, `stackra duplicate-exports`: the duplicate-export check of `pnpm validate` on
 *          its own. Prints each finding as `<dir>: <finding>`, a note for `ALLOWED` entries that no longer match a
 *          duplicate, and exits 1 on a finding (was `tools/scripts/duplicate-exports.mjs`).
 * Boundary: reads the workspace sources; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0305; stackra-224 (STA-1382); ADR 0282 (decision 3).
 */
import { ALLOWED } from "#node/duplicate-exports/constants/allowed.constant";
import { duplicateExportFindings } from "#node/duplicate-exports/functions/duplicate-export-findings.function";
import { staleAllowListEntries } from "#node/duplicate-exports/functions/stale-allow-list-entries.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra duplicate-exports` command. */
export const DUPLICATE_EXPORTS_COMMAND: CliCommand = {
  name: "duplicate-exports",
  summary: "Fail when one exported name is declared in two packages' src/",
  usage: "stackra duplicate-exports",
  async run({ cwd, io }) {
    const root = workspaceRoot(cwd);
    const findings = duplicateExportFindings(root);
    for (const { dir, text } of findings) io.err(`${dir}: ${text}\n`);
    const stale = staleAllowListEntries(root, ALLOWED, {});
    if (stale.length > 0)
      io.err(`note: no longer duplicated, remove from ALLOWED: ${stale.join(", ")}\n`);
    return findings.length > 0 ? 1 : 0;
  },
};

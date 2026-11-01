/**
 * Stackra file contract:
 * Purpose: `ANY_RATCHET_COMMAND`, `stackra any-ratchet`: the `any` ratchet of `pnpm validate` on its own. Prints each
 *          package above its baseline as `<dir>: <finding>`, a note naming the baselines that can be lowered, and exits
 *          1 on a finding (was `tools/scripts/any-ratchet.mjs`).
 * Boundary: reads the workspace sources and the baseline; writes nothing.
 * Runtime: node
 * Governing contract: rule-gap list N-5 (owner D11, 2026-10-28); STA-1388; ADR 0282 (decision 3).
 */
import { BASELINE_FILE } from "#node/any-ratchet/constants/baseline-file.constant";
import { anyRatchetFindings } from "#node/any-ratchet/functions/any-ratchet-findings.function";
import { loweredBaselines } from "#node/any-ratchet/functions/lowered-baselines.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra any-ratchet` command. */
export const ANY_RATCHET_COMMAND: CliCommand = {
  name: "any-ratchet",
  summary: "Fail when a package has more no-explicit-any disable comments than its baseline",
  usage: "stackra any-ratchet",
  async run({ cwd, io }) {
    const root = workspaceRoot(cwd);
    const findings = anyRatchetFindings(root);
    for (const { dir, text } of findings) io.err(`${dir}: ${text}\n`);
    const lowered = loweredBaselines(root);
    if (lowered.length > 0)
      io.err(`note: lower these in ${BASELINE_FILE}: ${lowered.join(", ")}\n`);
    return findings.length > 0 ? 1 : 0;
  },
};
